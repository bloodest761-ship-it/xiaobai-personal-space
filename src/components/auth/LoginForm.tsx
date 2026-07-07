"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionState } from "@/actions/auth";

const initialState: LoginActionState = {
  message: null,
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label className="block text-sm font-medium text-primary" htmlFor="email">
          邮箱
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.fields?.email}
          className="mt-2 min-h-11 w-full rounded-xl border border-border bg-surface px-4 py-2 text-base text-primary outline-none transition focus:border-accent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-primary" htmlFor="password">
          密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 min-h-11 w-full rounded-xl border border-border bg-surface px-4 py-2 text-base text-primary outline-none transition focus:border-accent"
        />
      </div>
      {state.message ? (
        <p className="rounded-xl border border-border bg-page px-4 py-3 text-sm leading-6 text-secondary">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full rounded-full border border-accent bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "登录中" : "登录"}
      </button>
    </form>
  );
}
