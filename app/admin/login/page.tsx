import { AdminLoginForm } from "@/components/admin-login-form";

export const dynamic="force-dynamic";
export default function AdminLoginPage(){
 return <section className="grid min-h-[75vh] place-items-center py-10"><AdminLoginForm/></section>;
}
