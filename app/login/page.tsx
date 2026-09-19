import Image from "next/image";
import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const LoginPage = async () => {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* ESQUERDA */}
      <div className=" mx-auto flex min-h-screen lg:min-h-0 w-full max-w-[550px] flex-col justify-center p-6 sm:p-8">
        {/* LOGO */}
        <Image
          src="/logo.png"
          alt="Connect Finance"
          width={1200}
          height={450}
          priority
          className="mb-[10%] w-[90%] h-auto object-contain scale-[1.6]"
        />

        <h1 className="mb-3 text-2xl sm:text-4xl font-bold">
          Bem-vindo
        </h1>

        <p className="mb-6 sm:mb-8 text-sm sm:text-base text-muted-foreground">
          A Connect Finance é uma plataforma de gestão financeira que utiliza IA para
          monitorar suas movimentações, e oferecer insights personalizados,
          facilitando o controle do seu orçamento.
        </p>

        <SignIn routing="hash" forceRedirectUrl="/dashboard" />
      </div>

      {/* DIREITA */}
      <div className="relative hidden lg:block h-full w-full">
        <Image
          src="/login.png"
          alt="Faça Login"
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
};

export default LoginPage;
