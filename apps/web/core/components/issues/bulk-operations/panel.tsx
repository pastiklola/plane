import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useMultipleSelectStore } from "@/hooks/store/use-multiple-select-store";
import { useProjectState } from "@/hooks/store/use-project-state";
import { ARCHIVABLE_STATE_GROUPS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ArchiveIcon, TrashIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import {
  EIssueServiceType,
  EIssuesStoreType,
  type TBulkIssueProperties,
  type TBulkOperationsPayload,
} from "@plane/types";
import { Button, Checkbox } from "@plane/ui";
import { cn } from "@plane/utils";
import { BellRingIcon } from "lucide-react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FormProvider, useForm, type SubmitErrorHandler } from "react-hook-form";
import { BulkArchiveIssueModal } from "./archive-issue-modal";
import { BulkDeleteIssueModal } from "./delete-issue-modal";
import { BulkIssueProperties } from "./issue-properties";
import { BulkSubscribeIssueModal } from "./subscribe-issue-modal";

type Props = {
  className?: string;
};

export const BulkOperationsPanel = observer(function BulkOperationsPanel({ className }: Props) {
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const projectId = routerProjectId?.toString();

  const { t } = useTranslation();
  const { selectedEntityIds, clearSelection } = useMultipleSelectStore();
  const { issues, issueMap } = useIssues(EIssuesStoreType.PROJECT);
  const { getStateById } = useProjectState();

  const { createSubscription } = useIssueDetail(EIssueServiceType.ISSUES);

  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [isArchiveEnabled, setIsArchiveEnabled] = useState(true);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    for (let i = 0; i < selectedEntityIds.length; i++) {
      const issue = issueMap[selectedEntityIds[i]];
      if (issue) {
        const stateDetails = getStateById(issue.state_id);
        const isInArchivableGroup = !!stateDetails && ARCHIVABLE_STATE_GROUPS.includes(stateDetails?.group);
        if (!isInArchivableGroup) {
          setIsArchiveEnabled(false);
          break;
        }
      }
    }
  }, [selectedEntityIds, issueMap, getStateById]);

  // form info
  const methods = useForm<TBulkIssueProperties>({
    defaultValues: {},
    reValidateMode: "onChange",
  });
  const {
    formState: { dirtyFields },
    handleSubmit,
    reset,
    watch,
    control,
  } = methods;

  const isDirty = Object.keys(dirtyFields).length > 0;

  const archiveBulkIssues = useCallback(
    async (issueIds: string[]) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.archiveBulkIssues(workspaceSlug, projectId, issueIds);
    },
    [issues, workspaceSlug, projectId]
  );

  const removeBulkIssues = useCallback(
    async (issueIds: string[]) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.removeBulkIssues(workspaceSlug, projectId, issueIds);
    },
    [issues, workspaceSlug, projectId]
  );

  const bulkUpdateProperties = useCallback(
    async (data: TBulkOperationsPayload) => {
      if (!workspaceSlug || !projectId) return;
      return await issues.bulkUpdateProperties(workspaceSlug, projectId, data);
    },
    [issues, workspaceSlug, projectId]
  );

  const handleOpenArchiveModal = () => {
    if (!isArchiveEnabled) {
      setToast({
        title: t("common.error.label"),
        type: TOAST_TYPE.ERROR,
        message: t("issue.archive.description"),
      });
      return;
    }

    setIsArchiveModalOpen(true);
  };

  const handleSubscribe = async () => {
    await Promise.all(
      selectedEntityIds.map((issueId) => {
        return new Promise<void>((resolve) => {
          createSubscription(workspaceSlug, projectId, issueId).finally(() => resolve());
        });
      })
    );
  };

  const handleArchive = async () => {
    await archiveBulkIssues(selectedEntityIds);
    clearSelection();
  };

  const handleDelete = async () => {
    await removeBulkIssues(selectedEntityIds);
    clearSelection();
  };

  const onSubmit = (values: TBulkIssueProperties) => {
    const payload: TBulkOperationsPayload = {
      issue_ids: selectedEntityIds,
      properties: {},
    };

    let propertyCount = 0;
    Object.keys(dirtyFields).forEach((key) => {
      const _key = key as keyof TBulkIssueProperties;
      payload.properties[_key] = values[_key] as any;
      propertyCount++;
    });

    const propertyCountMessage = propertyCount > 1 ? `${propertyCount} properties` : "1 property";
    const issueCountMessage = selectedEntityIds.length > 1 ? `${selectedEntityIds.length} work items` : "1 work item";

    setIsUpdating(true);
    bulkUpdateProperties(payload)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("success"),
          message: `Successfully updated ${propertyCountMessage} for ${issueCountMessage}`,
        });
        return reset({});
      })
      .catch(() => {
        setToast({
          title: t("common.error.label"),
          type: TOAST_TYPE.ERROR,
          message: t("common.error.message"),
        });
      })
      .finally(() => setIsUpdating(false));
  };

  const onValidationError: SubmitErrorHandler<TBulkIssueProperties> = (errors) => {
    const errorMessages = Object.values(errors)
      .map((err) => err.message)
      .filter(Boolean)
      .join("\n");

    setToast({
      title: t("common.error.label"),
      type: TOAST_TYPE.ERROR,
      message: errorMessages,
    });
  };

  return (
    <>
      <div className={cn("sticky bottom-0 left-0 z-10 h-14", className)}>
        <div className="flex size-full items-center divide-x-[0.5px] divide-subtle-1 border-t border-subtle-1 bg-surface-1 px-3.5 py-4 text-tertiary">
          <div className="flex h-7 flex-shrink-0 items-center gap-2 pr-3 text-13">
            <Checkbox indeterminate onClick={() => clearSelection()} />
            <div className="flex items-center gap-1">
              <span className="flex-shrink-0" style={{ minWidth: "8px" }}>
                {selectedEntityIds.length}
              </span>
              selected
            </div>
          </div>
          <div className="flex w-full overflow-hidden overflow-x-auto">
            <div className="flex grow">
              <div className="flex h-7 flex-shrink-0 items-center gap-6 px-3">
                <Tooltip tooltipHeading={t("common.actions.subscribe")} tooltipContent="">
                  <button
                    type="button"
                    className="grid place-items-center outline-none"
                    onClick={() => setIsSubscribeModalOpen(true)}
                  >
                    <BellRingIcon className="size-4" />
                  </button>
                </Tooltip>
                <Tooltip
                  tooltipHeading={t("common.actions.archive")}
                  tooltipContent={
                    isArchiveEnabled ? "" : "The selected work items are not in the right state group to archive"
                  }
                >
                  <button
                    type="button"
                    className={cn("grid place-items-center outline-none", { "cursor-not-allowed": !isArchiveEnabled })}
                    onClick={handleOpenArchiveModal}
                  >
                    <ArchiveIcon />
                  </button>
                </Tooltip>
              </div>
              <div className="flex h-7 flex-shrink-0 items-center gap-3 px-3">
                <Tooltip tooltipHeading={t("common.actions.delete")} tooltipContent="">
                  <button
                    type="button"
                    className="grid place-items-center outline-none"
                    onClick={() => setIsDeleteModalOpen(true)}
                  >
                    <TrashIcon />
                  </button>
                </Tooltip>
              </div>
              <div className="h-7 flex-grow pl-3">
                <FormProvider {...methods}>
                  <form onSubmit={handleSubmit(onSubmit, onValidationError)}>
                    <div className="flex size-full h-6 items-center justify-between gap-3">
                      <BulkIssueProperties
                        control={control}
                        projectId={projectId}
                        workspaceSlug={workspaceSlug?.toString()}
                        startDate={watch("start_date")}
                        targetDate={watch("target_date")}
                        handleFormChange={() => {}}
                      />

                      {isDirty && (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="neutral-primary"
                            size="sm"
                            className="h-6"
                            onClick={() => reset({})}
                            disabled={isUpdating}
                          >
                            Reset
                          </Button>

                          <Button type="submit" variant="primary" size="sm" className="h-6" disabled={isUpdating}>
                            {isUpdating ? "Updating" : "Update"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </form>
                </FormProvider>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BulkSubscribeIssueModal
        isOpen={isSubscribeModalOpen}
        handleClose={() => setIsSubscribeModalOpen(false)}
        onSubmit={handleSubscribe}
      />

      <BulkArchiveIssueModal
        isOpen={isArchiveModalOpen}
        handleClose={() => setIsArchiveModalOpen(false)}
        onSubmit={handleArchive}
      />

      <BulkDeleteIssueModal
        isOpen={isDeleteModalOpen}
        handleClose={() => setIsDeleteModalOpen(false)}
        onSubmit={handleDelete}
      />
    </>
  );
});
