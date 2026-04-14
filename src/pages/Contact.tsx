import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mail, Send, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Contact() {
  const { t } = useLanguage();
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success(t("page.contact.success"));
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="mb-4 text-4xl font-bold">{t("page.contact.title")}</h1>
          <p className="mb-10 max-w-2xl text-lg text-muted-foreground">{t("page.contact.desc")}</p>
        </motion.div>

        <div className="grid gap-12 md:grid-cols-2">
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4 rounded-xl border bg-card p-6"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">{t("page.contact.name")}</label>
              <Input required placeholder={t("page.contact.namePlaceholder")} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("page.contact.email")}</label>
              <Input type="email" required placeholder={t("page.contact.emailPlaceholder")} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("page.contact.message")}</label>
              <Textarea required rows={5} placeholder={t("page.contact.messagePlaceholder")} />
            </div>
            <Button type="submit" disabled={sending} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              {sending ? t("page.contact.sending") : t("page.contact.send")}
            </Button>
          </motion.form>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
            <div className="rounded-xl border bg-card p-6">
              <Mail className="mb-3 h-6 w-6 text-primary" />
              <h3 className="mb-1 font-semibold">{t("page.contact.emailUs")}</h3>
              <p className="text-sm text-muted-foreground">contact@drdata.app</p>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <MessageSquare className="mb-3 h-6 w-6 text-primary" />
              <h3 className="mb-1 font-semibold">{t("page.contact.support")}</h3>
              <p className="text-sm text-muted-foreground">{t("page.contact.supportDesc")}</p>
            </div>
          </motion.div>
        </div>

        <div className="mt-10">
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("auth.back")}
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
