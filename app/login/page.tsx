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
    <div className="grid h-full grid-cols-1 lg:grid-cols-2">
      {/*ESQUERDA*/}
      <div className="mx-auto flex h-full max-w-[550px] flex-col justify-center p-6 sm:p-8">
        <Image
          src="/logo.svg"
          width={173}
          height={39}
          alt="Finance AI"
          className="mb-8"
        />
        <h1 className="mb-3 text-3xl sm:text-4xl font-bold">Bem-vindo</h1>
        <p className="mb-8 text-sm sm:text-base text-muted-foreground">
          A Finance AI é uma plataforma de gestão financeira que utiliza IA para
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
