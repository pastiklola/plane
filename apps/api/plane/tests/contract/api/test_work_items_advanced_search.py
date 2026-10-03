# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.db.models import Issue, Project, ProjectMember


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the user as a member"""
    project = Project.objects.create(
        name="Search Project",
        identifier="SP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,
        is_active=True,
    )
    return project


@pytest.fixture
def issues(db, project, workspace, create_user):
    """Two work items with different priorities and names"""
    login_issue = Issue.objects.create(
        name="Fix login bug",
        project=project,
        workspace=workspace,
        priority="high",
        created_by=create_user,
    )
    logout_issue = Issue.objects.create(
        name="Fix logout bug",
        project=project,
        workspace=workspace,
        priority="low",
        created_by=create_user,
    )
    return login_issue, logout_issue


@pytest.mark.contract
class TestIssueAdvancedSearchEndpoint:
    """Test Advanced search work items endpoint"""

    def get_url(self, workspace_slug):
        return f"/api/v1/workspaces/{workspace_slug}/work-items/advanced-search/"

    @pytest.mark.django_db
    def test_empty_body_returns_recent_work_items(self, api_key_client, workspace, issues):
        response = api_key_client.post(self.get_url(workspace.slug), {}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) == 2
        first = response.data[0]
        for field in [
            "id",
            "name",
            "sequence_id",
            "project_identifier",
            "project_id",
            "workspace_id",
            "state_id",
            "priority",
            "target_date",
            "start_date",
        ]:
            assert field in first

    @pytest.mark.django_db
    def test_query_filters_by_text(self, api_key_client, workspace, issues):
        response = api_key_client.post(
            self.get_url(workspace.slug), {"query": "login", "limit": 10}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["name"] == "Fix login bug"
        assert response.data[0]["project_identifier"] == "SP"

    @pytest.mark.django_db
    def test_structured_filters_applied(self, api_key_client, workspace, issues):
        response = api_key_client.post(
            self.get_url(workspace.slug),
            {"filters": {"priority__in": ["high"]}},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["priority"] == "high"

    @pytest.mark.django_db
    def test_logical_operator_filters(self, api_key_client, workspace, issues):
        response = api_key_client.post(
            self.get_url(workspace.slug),
            {"filters": {"or": [{"priority__in": ["low"]}, {"priority__in": ["high"]}]}},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

    @pytest.mark.django_db
    def test_invalid_filter_field_rejected(self, api_key_client, workspace, issues):
        response = api_key_client.post(
            self.get_url(workspace.slug),
            {"filters": {"password__icontains": "x"}},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_project_id_and_workspace_search_scoping(
        self, api_key_client, workspace, project, issues, create_user
    ):
        second_project = Project.objects.create(
            name="Second Project",
            identifier="SP2",
            workspace=workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(
            project=second_project,
            member=create_user,
            role=20,
            is_active=True,
        )
        Issue.objects.create(
            name="Second project issue",
            project=second_project,
            workspace=workspace,
            priority="urgent",
            created_by=create_user,
        )

        scoped_res = api_key_client.post(
            self.get_url(workspace.slug),
            {"project_id": str(project.id)},
            format="json",
        )
        assert scoped_res.status_code == status.HTTP_200_OK
        assert len(scoped_res.data) == 2

        ws_res = api_key_client.post(
            self.get_url(workspace.slug),
            {"project_id": str(project.id), "workspace_search": True},
            format="json",
        )
        assert ws_res.status_code == status.HTTP_200_OK
        assert len(ws_res.data) == 3

    @pytest.mark.django_db
    def test_invalid_limit_rejected(self, api_key_client, workspace, issues):
        response = api_key_client.post(
            self.get_url(workspace.slug), {"limit": "abc"}, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
