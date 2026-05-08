/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useState } from "react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EViewAccess, type IWorkspaceView } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn, copyUrlToClipboard } from "@plane/utils";
// helpers
import { useViewMenuItems } from "@/components/common/quick-actions-helper";
// hooks
import { useUser, useUserPermissions } from "@/hooks/store/user";
// local imports
import { useGlobalView } from "@/hooks/store/use-global-view";
import { DeleteGlobalViewModal } from "./delete-view-modal";
import { CreateUpdateWorkspaceViewModal } from "./modal";

type Props = {
  workspaceSlug: string;
  view: IWorkspaceView;
};

export const WorkspaceViewQuickActions = observer(function WorkspaceViewQuickActions(props: Props) {
  const { workspaceSlug, view } = props;
  // states
  const [updateViewModal, setUpdateViewModal] = useState(false);
  const [deleteViewModal, setDeleteViewModal] = useState(false);
  // store hooks
  const { data } = useUser();
  const { allowPermissions } = useUserPermissions();
  const { lockGlobalView, updateGlobalView } = useGlobalView();

  // auth
  const isOwner = view?.owned_by === data?.id;
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const viewLink = `${workspaceSlug}/workspace-views/${view.id}`;
  const handleCopyText = async () => {
    await copyUrlToClipboard(viewLink);
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: "Link Copied!",
      message: "View link copied to clipboard.",
    });
  };

  const handleOpenInNewTab = () => window.open(`/${viewLink}`, "_blank");
  const handleToggleLock = async () => {
    if (!workspaceSlug) return;
    const isLocked = !view.is_locked;
    const action = isLocked ? "locked" : "unlocked";
    try {
      await lockGlobalView(workspaceSlug.toString(), view.id, isLocked);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: `View ${action} successfully.`,
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: `View could not be ${action}. Please try again.`,
      });
    }
  };

  const handleToggleAccess = async () => {
    if (!workspaceSlug) return;
    const access = view.access === EViewAccess.PUBLIC ? EViewAccess.PRIVATE : EViewAccess.PUBLIC;
    const accessString = view.access === EViewAccess.PRIVATE ? "public" : "private";
    try {
      await updateGlobalView(workspaceSlug.toString(), view.id, { access });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: `View access has been changed to ${accessString}.`,
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: `Could not change view access to ${accessString}. Please try again.`,
      });
    }
  };

  const MENU_ITEMS = useViewMenuItems({
    isOwner,
    isAdmin,
    handleDelete: () => setDeleteViewModal(true),
    handleEdit: () => setUpdateViewModal(true),
    handleOpenInNewTab,
    handleCopyLink: handleCopyText,
    workspaceSlug,
    view,
    handleToggleLock,
    handleToggleAccess,
  });

  return (
    <>
      <CreateUpdateWorkspaceViewModal data={view} isOpen={updateViewModal} onClose={() => setUpdateViewModal(false)} />
      <DeleteGlobalViewModal data={view} isOpen={deleteViewModal} onClose={() => setDeleteViewModal(false)} />
      <CustomMenu
        ellipsis
        placement="bottom-end"
        closeOnSelect
        buttonClassName="flex-shrink-0 flex items-center justify-center size-[26px] bg-layer-1/70 rounded-sm"
      >
        {MENU_ITEMS.items.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={() => {
                item.action();
              }}
              className={cn(
                "flex items-center gap-2",
                {
                  "text-placeholder": item.disabled,
                },
                item.className
              )}
              disabled={item.disabled}
            >
              {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
              <div>
                <h5>{item.title}</h5>
                {item.description && (
                  <p
                    className={cn("whitespace-pre-line text-tertiary", {
                      "text-placeholder": item.disabled,
                    })}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </>
  );
});
