/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useForm } from "react-hook-form";
import { Controller } from "react-hook-form";
import { ThoughtsOutline } from "@makeplane/propel/icons";
import { Button } from "@makeplane/propel/components/button";
import { TextArea, TextAreaGroup } from "@makeplane/propel/components/text-area";
import type { IFormattedInstanceConfiguration, TInstanceAIConfigurationKeys } from "@plane/types";
// components
import type { TControllerInputFormField } from "@/components/common/controller-input";
import { ControllerInput } from "@/components/common/controller-input";
import { setToast } from "@plane/blocks/toast";
// hooks
import { useInstance } from "@/hooks/store";

type IInstanceAIForm = {
  config: IFormattedInstanceConfiguration;
};

type AIFormValues = Record<TInstanceAIConfigurationKeys, string>;

export function InstanceAIForm(props: IInstanceAIForm) {
  const { config } = props;
  // store
  const { updateInstanceConfigurations } = useInstance();
  // form data
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AIFormValues>({
    defaultValues: {
      LLM_API_KEY: config["LLM_API_KEY"],
      LLM_MODEL: config["LLM_MODEL"],
      LLM_BASE_URL: config["LLM_BASE_URL"],
      LLM_SYSTEM_PROMPT: config["LLM_SYSTEM_PROMPT"],
    },
  });

  const aiFormFields: TControllerInputFormField<AIFormValues>[] = [
    {
      key: "LLM_MODEL",
      type: "text",
      label: "LLM Model",
      description: (
        <>
          Choose an OpenAI engine.{" "}
          <a
            href="https://platform.openai.com/docs/models/overview"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
            aria-label="OpenAI models documentation"
          >
            Learn more
          </a>
        </>
      ),
      placeholder: "gpt-4o-mini",
      error: Boolean(errors.LLM_MODEL),
      required: false,
    },
    {
      key: "LLM_API_KEY",
      type: "password",
      label: "API key",
      description: (
        <>
          You will find your API key{" "}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
            aria-label="OpenAI API keys page"
          >
            here.
          </a>
        </>
      ),
      placeholder: "sk-asddassdfasdefqsdfasd23das3dasdcasd",
      error: Boolean(errors.LLM_API_KEY),
      required: false,
    },
    {
      key: "LLM_BASE_URL",
      type: "text",
      label: "Base URL",
      description:
        "Optional. Any OpenAI-compatible endpoint (Ollama, vLLM, OpenRouter, etc.). Leave empty to use the default OpenAI API.",
      placeholder: "https://api.openai.com/v1",
      error: Boolean(errors.LLM_BASE_URL),
      required: false,
    },
  ];

  const onSubmit = async (formData: AIFormValues) => {
    const payload: Partial<AIFormValues> = { ...formData };

    await updateInstanceConfigurations(payload)
      .then(() =>
        setToast({
          type: "success",
          title: "Success",
          message: "AI Settings updated successfully",
        })
      )
      .catch((err) => console.error(err));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div>
          <div className="pb-1 text-18 font-medium text-primary">OpenAI</div>
          <div className="text-13 font-regular text-tertiary">If you use ChatGPT, this is for you.</div>
        </div>
        <div className="grid-col grid w-full grid-cols-1 items-start justify-between gap-x-12 gap-y-8 lg:grid-cols-3">
          {aiFormFields.map((field) => (
            <ControllerInput
              key={field.key}
              control={control}
              type={field.type}
              name={field.key}
              label={field.label}
              description={field.description}
              placeholder={field.placeholder}
              error={field.error}
              required={field.required}
            />
          ))}
        </div>
        <div className="space-y-1">
          <label htmlFor="LLM_SYSTEM_PROMPT" className="text-13 text-tertiary">
            System prompt
          </label>
          <TextAreaGroup resize="vertical">
            <Controller
              control={control}
              name="LLM_SYSTEM_PROMPT"
              render={({ field: { value, onChange, ref } }) => (
                <TextArea
                  size="lg"
                  surface="field"
                  rows={4}
                  id="LLM_SYSTEM_PROMPT"
                  name="LLM_SYSTEM_PROMPT"
                  value={value ?? ""}
                  onChange={onChange}
                  ref={ref}
                  placeholder="Leave empty to use the built-in default: guides the assistant to act as Plane's issue-description writer and output only the description text."
                />
              )}
            />
          </TextAreaGroup>
          <p className="text-12 text-tertiary">
            Optional. Sets the assistant&apos;s context and expected output format. Leave empty to use the built-in
            default.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-4">
        <Button
          variant="primary"
          size="md"
          stretch="auto"
          onClick={handleSubmit(onSubmit)}
          loading={isSubmitting}
          label={isSubmitting ? "Saving" : "Save changes"}
        />

        <div className="relative inline-flex items-center gap-1.5 rounded-sm border border-accent-subtle bg-accent-subtle px-4 py-2 text-caption-sm-regular text-accent-secondary">
          <ThoughtsOutline className="size-4" />
          <div>
            If you have a preferred AI models vendor, please get in{" "}
            <a className="font-medium underline" href="https://plane.so/contact">
              touch with us.
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
