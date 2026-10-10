/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ETabIndices } from "@plane/constants";
import { DateSelect } from "@plane/blocks/property-select";
import { useTranslation } from "@plane/i18n";
import { observer } from "mobx-react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
// types
import type { TBulkIssueProperties } from "@plane/types";
// ui
import { getDate, getTabIndex, renderFormattedPayloadDate } from "@plane/utils";
// components
import { CycleSelect } from "@/components/dropdowns/cycle/cycle-select";
import { EstimateSelect } from "@/components/dropdowns/estimate/estimate-select";
import { LabelSelect } from "@/components/dropdowns/label/label-select";
import { MemberSelect } from "@/components/dropdowns/member/member-select";
import { ModuleSelect } from "@/components/dropdowns/module/module-select";
import { PrioritySelect } from "@/components/dropdowns/priority/priority-select";
import { StateSelect } from "@/components/dropdowns/state/state-select";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectEstimates } from "@/hooks/store/estimates";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TBulkIssuePropertiesProps = {
  control: Control<TBulkIssueProperties>;
  projectId: string | null;
  startDate: string | null;
  targetDate: string | null;
  handleFormChange: () => void;
};

export const BulkIssueProperties = observer(function BulkIssueProperties(props: TBulkIssuePropertiesProps) {
  const { control, projectId, startDate, targetDate, handleFormChange } = props;
  // store hooks
  const { t } = useTranslation();
  const { getProjectById } = useProject();
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const { isMobile } = usePlatformOS();
  // derived values
  const projectDetails = getProjectById(projectId);
  const isEstimateEnabled = projectId ? areEstimateEnabledByProjectId(projectId) : false;

  const { getIndex } = getTabIndex(ETabIndices.ISSUE_FORM, isMobile);

  const minDate = getDate(startDate);
  const maxDate = getDate(targetDate);

  return (
    <div className="flex h-full items-center gap-3">
      <Controller
        control={control}
        name="state_id"
        render={({ field: { value, onChange } }) => (
          <div className="block h-full">
            <StateSelect
              value={value}
              onChange={(stateId) => {
                onChange(value === stateId ? undefined : stateId);
                handleFormChange();
              }}
              projectId={projectId ?? undefined}
              variant="pill-md"
              tabIndex={getIndex("state_id")}
              placeholder={t("state")}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="priority"
        render={({ field: { value, onChange } }) => (
          <div className="block h-full">
            <PrioritySelect
              value={value}
              onChange={(priority) => {
                onChange(priority);
                handleFormChange();
              }}
              variant="pill-md"
              tabIndex={getIndex("priority")}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="assignee_ids"
        render={({ field: { value, onChange } }) => (
          <div className="block h-full">
            <MemberSelect
              projectId={projectId ?? undefined}
              value={value ?? []}
              onChange={(assigneeIds) => {
                onChange(assigneeIds);
                handleFormChange();
              }}
              placeholder={t("assignees")}
              multiple
              variant={(value ?? []).length > 0 ? "avatar-group-md" : "pill-md"}
              tabIndex={getIndex("assignee_ids")}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="label_ids"
        render={({ field: { value, onChange } }) => (
          <div className="block h-full">
            <LabelSelect
              value={value ?? []}
              onChange={(labelIds) => {
                onChange(labelIds);
                handleFormChange();
              }}
              projectId={projectId ?? undefined}
              variant="pill-md"
              placeholder={t("labels")}
              tabIndex={getIndex("label_ids")}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="start_date"
        render={({ field: { value, onChange } }) => (
          <div className="block h-full">
            <DateSelect
              value={(value ? getDate(value) : null) ?? null}
              onChange={(date) => {
                onChange(date ? renderFormattedPayloadDate(date) : null);
                handleFormChange();
              }}
              variant="pill-md"
              maxDate={maxDate ?? undefined}
              placeholder={t("start_date")}
              clearable
              clearLabel={t("common.clear")}
              tabIndex={getIndex("start_date")}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="target_date"
        render={({ field: { value, onChange } }) => (
          <div className="block h-full">
            <DateSelect
              value={(value ? getDate(value) : null) ?? null}
              onChange={(date) => {
                onChange(date ? renderFormattedPayloadDate(date) : null);
                handleFormChange();
              }}
              variant="pill-md"
              minDate={minDate ?? undefined}
              placeholder={t("due_date")}
              clearable
              clearLabel={t("common.clear")}
              tabIndex={getIndex("target_date")}
            />
          </div>
        )}
      />
      {projectDetails?.cycle_view && (
        <Controller
          control={control}
          name="cycle_id"
          render={({ field: { value, onChange } }) => (
            <div className="block h-full">
              <CycleSelect
                projectId={projectId ?? undefined}
                onChange={(cycleId) => {
                  onChange(cycleId);
                  handleFormChange();
                }}
                placeholder={t("cycle.label", { count: 1 })}
                value={value}
                variant="pill-md"
                tabIndex={getIndex("cycle_id")}
              />
            </div>
          )}
        />
      )}
      {projectDetails?.module_view && (
        <Controller
          control={control}
          name="module_ids"
          render={({ field: { value, onChange } }) => (
            <div className="block h-full">
              <ModuleSelect
                projectId={projectId ?? undefined}
                value={value ?? []}
                onChange={(moduleIds) => {
                  onChange(moduleIds);
                  handleFormChange();
                }}
                placeholder={t("modules")}
                variant="pill-md"
                multiple
                tabIndex={getIndex("module_ids")}
              />
            </div>
          )}
        />
      )}
      {projectId && isEstimateEnabled && (
        <Controller
          control={control}
          name="estimate_point"
          render={({ field: { value, onChange } }) => (
            <div className="block h-full">
              <EstimateSelect
                value={value || undefined}
                onChange={(estimatePoint) => {
                  onChange(estimatePoint);
                  handleFormChange();
                }}
                projectId={projectId}
                variant="pill-md"
                tabIndex={getIndex("estimate_point")}
                placeholder={t("estimate")}
              />
            </div>
          )}
        />
      )}
    </div>
  );
});
