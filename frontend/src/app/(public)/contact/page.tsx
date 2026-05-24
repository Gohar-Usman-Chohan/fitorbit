'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Clock, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PublicPageLayout } from '@/components/features/public/PublicPageLayout';
import { CONTACT_INFO, SUPPORT_EMAIL } from '@/content/siteContent';
import { validateEmail } from '@/lib/validation';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim() || name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      toast.error(emailError);
      return;
    }

    if (!subject.trim() || subject.trim().length < 3) {
      toast.error('Subject must be at least 3 characters');
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      toast.error('Message must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);

    const body = encodeURIComponent(
      `Name: ${name.trim()}\nEmail: ${email.trim()}\n\n${message.trim()}`
    );
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject.trim())}&body=${body}`;

    window.location.href = mailto;
    toast.success('Opening your email app to send the message.');
    setIsSubmitting(false);
  };

  return (
    <PublicPageLayout
      title="Contact Us"
      subtitle="Have a question, feedback, or need help? Our team is here for you."
      maxWidth="xl"
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Mail size={18} />
              </span>
              <div>
                <p className="font-semibold text-slate-900">Email</p>
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="mt-1 block text-sm text-blue-600 hover:text-blue-700"
                >
                  {CONTACT_INFO.email}
                </a>
                <a
                  href={`mailto:${CONTACT_INFO.supportEmail}`}
                  className="mt-1 block text-sm text-slate-600 hover:text-blue-600"
                >
                  Support: {CONTACT_INFO.supportEmail}
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Clock size={18} />
              </span>
              <div>
                <p className="font-semibold text-slate-900">Support hours</p>
                <p className="mt-1 text-sm text-slate-600">{CONTACT_INFO.hours}</p>
                <p className="mt-2 text-sm text-slate-500">{CONTACT_INFO.responseTime}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <MessageCircle size={18} />
              </span>
              <div>
                <p className="font-semibold text-slate-900">Quick answers</p>
                <p className="mt-1 text-sm text-slate-600">
                  Check the{' '}
                  <Link href="/faq" className="font-semibold text-blue-600 hover:text-blue-700">
                    FAQ
                  </Link>{' '}
                  for instant help with common topics.
                </p>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2"
        >
          <h2 className="text-lg font-semibold text-slate-900">Send us a message</h2>
          <p className="mt-1 text-sm text-slate-600">
            Fill out the form and we&apos;ll open your email app with the message ready to send.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="subject" className="mb-1 block text-sm font-medium text-slate-700">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="How can we help?"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="message" className="mb-1 block text-sm font-medium text-slate-700">
              Message
            </label>
            <textarea
              id="message"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us more about your question..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-400 md:w-auto md:px-8"
          >
            {isSubmitting ? 'Preparing...' : 'Send message'}
          </button>
        </form>
      </div>
    </PublicPageLayout>
  );
}
