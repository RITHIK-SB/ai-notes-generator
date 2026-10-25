import { Link } from 'react-router-dom';
import {
  ArrowRight, ClipboardList, Download, FileText, ListTree, SlidersHorizontal, Timer,
} from 'lucide-react';

const features = [
  { icon: ClipboardList, title: 'Smart Summarization', text: 'Transform lengthy content into concise notes.' },
  { icon: FileText, title: 'Document Support', text: 'Extract text from supported study documents.' },
  { icon: ListTree, title: 'Structured Notes', text: 'Organize information using headings, bullet points, and key concepts.' },
  { icon: SlidersHorizontal, title: 'Customizable Output', text: 'Choose note length, style, and difficulty level.' },
  { icon: Download, title: 'Download Notes', text: 'Export generated notes into supported file formats.' },
  { icon: Timer, title: 'Time-Saving Learning', text: 'Spend less time organizing information and more time understanding it.' },
];

const steps = [
  'Upload or paste study material.',
  'Choose your preferred note settings.',
  'Generate notes using AI.',
  'Review and download your notes.',
];

export default function Home() {
  return (
    <div>
      <section className="border-b border-gray-200 bg-gradient-to-b from-primary-50 to-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <h1 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight text-primary-950 sm:text-5xl">
            Turn Long Study Material Into Smart Notes
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-gray-600 sm:text-lg">
            Upload your study material or paste your text, and let AI transform it into concise,
            structured notes that make learning and revision easier.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/generate" className="btn-primary w-full sm:w-auto">
              Generate Notes <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a href="#features" className="btn-secondary w-full sm:w-auto">
              Explore Features
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-center text-2xl font-bold text-primary-950">
          Everything you need for faster revision
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card p-6">
              <f.icon className="h-7 w-7 text-primary-600" aria-hidden />
              <h3 className="mt-4 text-base font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-1.5 text-sm text-gray-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white" aria-labelledby="how-heading">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 id="how-heading" className="text-center text-2xl font-bold text-primary-950">
            How it works
          </h2>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step} className="card p-6">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-accent-500 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <p className="mt-3 text-sm font-medium text-gray-800">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-primary-950">Ready to simplify your revision?</h2>
        <Link to="/generate" className="btn-primary mt-6">
          Generate Your First Notes <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
