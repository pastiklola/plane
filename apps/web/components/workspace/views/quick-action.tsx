/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useState } from "react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { MoreHorizontalOutline } from "@makeplane/propel/icons";
import { getRenderableItems, resolveItemVariant } from "@plane/blocks/context-menu";
import { setToast } from "@plane/blocks/toast";
import { EViewAccess, type IWorkspaceView } from "@plane/types";
import { copyUrlToClipboard } from "@plane/utils";
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
  // plane hooks
  const { t } = useTranslation();
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
      type: "success",
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
        type: "success",
        title: "Success!",
        message: `View ${action} successfully.`,
      });
    } catch (_error) {
      setToast({
        type: "error",
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
        type: "success",
        title: "Success!",
        message: `View access has been changed to ${accessString}.`,
      });
    } catch (_error) {
      setToast({
        type: "error",
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
      <Menu>
        <MenuTrigger
          render={
            <IconButton
              variant="ghost"
              size="sm"
              aria-label={t("aria_labels.common.more_actions")}
              icon={<Icon icon={MoreHorizontalOutline} />}
            />
          }
        />
        <MenuContent side="bottom" align="end">
          {getRenderableItems(MENU_ITEMS.items).map((item) => (
            <MenuItem
              key={item.key}
              variant={resolveItemVariant(item)}
              icon={item.icon ? <Icon icon={item.icon} /> : undefined}
              label={item.title ?? ""}
              description={item.description}
              disabled={item.disabled}
              onClick={() => {
                item.action();
              }}
            />
          ))}
        </MenuContent>
      </Menu>
    </>
  );
});
