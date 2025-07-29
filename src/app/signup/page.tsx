export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
      <form className="flex flex-col gap-4 w-full max-w-sm">
        <input type="email" placeholder="Email" className="border p-2 rounded" required />
        <input type="password" placeholder="Password" className="border p-2 rounded" required />
        <input type="password" placeholder="Confirm Password" className="border p-2 rounded" required />
        <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Sign Up</button>
      </form>
      <p className="mt-4 text-sm">
        Already have an account? <a href="/signin" className="text-blue-600 underline">Sign In</a>
      </p>
    </div>
  );
} 