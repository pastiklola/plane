/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
// types
import { EUserPermissions, EUserPermissionsLevel, PROJECT_ERROR_MESSAGES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// ui
import { AlertModalCore } from "@plane/ui";
// constants
// hooks
import { useMultipleSelectStore } from "@/hooks/store/use-multiple-select-store";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// plane-web

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  onSubmit?: () => Promise<void>;
};

export const BulkSubscribeIssueModal = observer(function BulkSubscribeIssueModal(props: Props) {
  const { isOpen, handleClose, onSubmit } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);
  // store hooks
  const { workspaceSlug } = useParams();
  const { currentProjectDetails: projectDetails } = useProject();
  const { allowPermissions } = useUserPermissions();
  const { t } = useTranslation();
  const { selectedEntityIds } = useMultipleSelectStore();

  useEffect(() => {
    setIsLoading(false);
  }, [isOpen]);

  if (!selectedEntityIds.length) return null;

  const authorized = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug?.toString(),
    projectDetails?.id
  );

  const onClose = () => {
    setIsLoading(false);
    handleClose();
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    if (!authorized) {
      setToast({
        title: t(PROJECT_ERROR_MESSAGES.permissionError.i18n_title),
        type: TOAST_TYPE.ERROR,
        message:
          PROJECT_ERROR_MESSAGES.permissionError.i18n_message && t(PROJECT_ERROR_MESSAGES.permissionError.i18n_message),
      });
      onClose();
      return;
    }
    if (onSubmit)
      await onSubmit()
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("common.success"),
            message: t("issue.subscription.actions.subscribed"),
          });
          return onClose();
        })
        .catch(() => {
          setToast({
            title: t("common.error.label"),
            type: TOAST_TYPE.ERROR,
            message: t("common.error.message"),
          });
        })
        .finally(() => onClose());
  };

  return (
    <AlertModalCore
      handleClose={onClose}
      handleSubmit={handleSubmit}
      isSubmitting={isLoading}
      isOpen={isOpen}
      variant="primary"
      primaryButtonText={{
        default: "Subscribe",
        loading: "Subscribing",
      }}
      hideIcon
      title={`Subscribe to ${t("common.work_item")}`}
      content={
        <>
          {/* TODO: Translate here */}
          {`Are you sure you want to subscribe to `}
          {selectedEntityIds.length === 1 ? `1 work item` : `${selectedEntityIds.length} work items`}
          {`? Once subscribed you will be notified about any updates of the work item.`}
        </>
      }
    />
  );
});
