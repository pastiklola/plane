/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { BlockedIcon, LockIcon, type ISvgIcons } from "@plane/propel/icons";
import { EViewAccess, type IProjectView } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { EarthIcon } from "lucide-react";
import { observer } from "mobx-react";
import { Controller, type Control } from "react-hook-form";

type Props = {
  control: Control<IProjectView>;
};

const accessChoices: { key: string; label: string; value: EViewAccess; icon: React.FC<ISvgIcons> }[] = [
  {
    key: "public",
    label: "Public",
    value: EViewAccess.PUBLIC,
    icon: EarthIcon,
  },
  {
    key: "private",
    label: "Private",
    value: EViewAccess.PRIVATE,
    icon: LockIcon,
  },
];

export const AccessController = observer(function AccessController({ control }: Props) {
  return (
    <Controller
      control={control}
      name="access"
      render={({ field: { value, onChange } }) => {
        const selectedAccess = accessChoices.find((n) => n.value === value);
        return (
          <CustomSelect
            value={value}
            onChange={onChange}
            label={
              <div className="flex items-center gap-2">
                {selectedAccess ? (
                  <>
                    <selectedAccess.icon className="h-3.5 w-3.5" />
                    {selectedAccess.label}
                  </>
                ) : (
                  <>
                    <BlockedIcon className="h-3.5 w-3.5" />
                    Select access
                  </>
                )}
              </div>
            }
            buttonClassName="!border-subtle !shadow-none font-medium rounded-md py-1"
            input
          >
            {accessChoices.map((access) => (
              <CustomSelect.Option key={access.key} value={access.value}>
                <div className="flex items-center gap-2">
                  <access.icon className="h-3.5 w-3.5" />
                  <p>{access.label}</p>
                </div>
              </CustomSelect.Option>
            ))}
          </CustomSelect>
        );
      }}
    ></Controller>
  );
});
