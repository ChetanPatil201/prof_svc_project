"use client"
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate authentication delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12">
      <h1 className="text-2xl font-bold mb-4">Sign In</h1>
      <form className="flex flex-col gap-4 w-full max-w-sm" onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" className="border p-2 rounded" required />
        <input type="password" placeholder="Password" className="border p-2 rounded" required />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing In..." : "Sign In"}
        </button>
      </form>
      <p className="mt-4 text-sm">
        Don't have an account? <a href="/signup" className="text-blue-600 underline">Sign Up</a>
      </p>
    </div>
  );
} 