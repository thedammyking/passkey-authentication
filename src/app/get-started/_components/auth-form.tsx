"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { generateOptions, verifyAttestationResponse } from "@/app/actions";
import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/types";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  email: z.string().email(),
});

type FormValues = z.infer<typeof formSchema>;

const FORM_DEFAULT_VALUES: FormValues = {
  email: "",
};

export default function AuthForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: FORM_DEFAULT_VALUES,
  });

  const router = useRouter();

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      const { email } = data;
      const optionsResponse = await generateOptions(email);
      if (!optionsResponse.data) {
        throw new Error(optionsResponse.error ?? "Failed to generate options");
      }

      const { options, isNewUser } = optionsResponse.data;
      const attResp = isNewUser
        ? await startRegistration(
            options as PublicKeyCredentialCreationOptionsJSON,
          )
        : await startAuthentication(options);

      const verificationResponse = await verifyAttestationResponse(
        email,
        attResp,
      );
      if (!verificationResponse.data) {
        throw new Error(verificationResponse.error ?? "Verification failed");
      }

      if (verificationResponse.data.verified) {
        void router.push("/");
      } else {
        throw new Error("Verification unsuccessful");
      }
    } catch (error) {
      setError("root", {
        type: "manual",
        message: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label className="text-sm" htmlFor="email">
          Email
        </Label>
        <Input
          {...register("email", { required: true })}
          id="email"
          placeholder="Enter your email"
          className={clsx(
            "min-h-12 rounded-md border-2 border-neutral-50 text-neutral-950",
            errors.email && "border-red-500 bg-red-50",
          )}
        />
        {errors.email && (
          <span className="mt-1 text-xs text-red-500">
            {errors.email.message}
          </span>
        )}
      </div>

      <Button
        variant="outline"
        className="min-h-12 w-full rounded-md bg-neutral-900 text-white"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Loading..." : "Get Started"}
      </Button>

      {errors.root && (
        <span className="mt-10 text-sm text-red-500">
          {errors.root.message}
        </span>
      )}
    </form>
  );
}
