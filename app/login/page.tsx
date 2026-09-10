import Image from "next/image";
import { Button } from "../_components/ui/button";
import { LogInIcon } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const LoginPage = async () => {
  const { userId } = await auth();
  if (userId) {
    redirect("/");
  }
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/*ESQUERDA*/}
      <div className="mx-auto flex min-h-screen lg:min-h-0 w-full max-w-[550px] flex-col justify-center p-6 sm:p-8">
        <Image
          src="/logo.png"
          width={173}
          height={39}
          alt="Connect Finance"
          className="mb-6 sm:mb-8 h-8 sm:h-9 w-auto"
        />
        <h1 className="mb-3 text-2xl sm:text-4xl font-bold">Bem-vindo</h1>
        <p className="mb-6 sm:mb-8 text-sm sm:text-base text-muted-foreground">
          A Connect Finance é uma plataforma de gestão financeira que utiliza IA para
          monitorar suas movimentações, e oferecer insights personalizados,
          facilitando o controle do seu orçamento.
        </p>
        <SignInButton>
          <Button variant="outline" className="w-full sm:w-auto h-11 min-h-[44px]">
            <LogInIcon className="mr-2 h-4 w-4" />
            Fazer Login ou criar conta
          </Button>
        </SignInButton>
      </div>

      {/*DIREITA*/}
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
