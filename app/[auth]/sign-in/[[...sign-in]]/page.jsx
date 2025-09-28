
"use client";

import { SignIn } from "@clerk/nextjs";
import React from "react";

const SignInPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn
        redirectUrl="/interview/mock"   // default redirect after login
        signUpUrl="/sign-up"            // optional: link to sign-up
      />
    </div>
  );
};

export default SignInPage;
