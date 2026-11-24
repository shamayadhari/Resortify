import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Send } from "lucide-react";
import { useForm } from "react-hook-form";

import { ApiStatusNotice } from "@/components/site/ApiStatusNotice";
import { FormAlert, FormField } from "@/components/site/FormField";
import { PageIntro, PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contactSchema, type ContactInput } from "@/lib/validation";
import { contactService } from "@/services/contact.service";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Resortify" },
      { name: "description", content: "Questions, partnership ideas or feedback for Resortify? Send us a message." },
      { property: "og:title", content: "Contact Resortify" },
      { property: "og:description", content: "Reach the Resortify team about partnerships, feedback or support." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contact,
});

function Contact() {
  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "" },
  });
  const mutation = useMutation({
    mutationFn: contactService.send,
    onSuccess: () => form.reset(),
  });
  const { errors } = form.formState;

  return (
    <PublicLayout>
      <PageIntro eyebrow="Contact" title="Let's talk.">
        <p>Scrap dealer, recycler, NGO, college or curious citizen: we'd love to hear from you.</p>
      </PageIntro>
      <section className="container-page py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-border bg-paper p-6 shadow-soft md:p-10">
          <ApiStatusNotice className="mb-6" />
          {mutation.isSuccess && (
            <div className="mb-6">
              <FormAlert tone="success">{mutation.data.message || "Thanks! Your message has been sent."}</FormAlert>
            </div>
          )}
          {mutation.isError && (
            <div className="mb-6">
              <FormAlert>{mutation.error.message}</FormAlert>
            </div>
          )}
          <form className="space-y-5" noValidate onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
            <FormField id="name" label="Your name" error={errors.name?.message}>
              <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...form.register("name")} />
            </FormField>
            <FormField id="email" label="Email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register("email")} />
            </FormField>
            <FormField id="message" label="Message" error={errors.message?.message}>
              <Textarea id="message" rows={5} aria-invalid={!!errors.message} {...form.register("message")} />
            </FormField>
            <Button type="submit" variant="hero" size="xl" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="animate-spin" /> : <Send />} Send message
            </Button>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}
