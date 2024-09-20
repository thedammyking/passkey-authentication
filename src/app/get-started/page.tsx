import LoginForm from "./_components/auth-form";

export default async function GetStarted() {
  return (
    <div className="w-full max-w-80">
      <header className="mb-10 py-10">
        <h1 className="text-4xl font-medium">Welcome</h1>
      </header>
      <LoginForm />
    </div>
  );
}
