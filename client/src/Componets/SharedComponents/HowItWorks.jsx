const STEPS = [
  {
    step: '1',
    title: 'Create an account',
    desc: 'Sign up as a Patient or register as a Doctor. Admins are provisioned internally.',
  },
  {
    step: '2',
    title: 'Find a doctor',
    desc: 'Filter by specialty, availability, or rating and view full verified profiles.',
  },
  {
    step: '3',
    title: 'Book & pay',
    desc: 'Pick a time slot, confirm your appointment, and complete secure online payment.',
  },
  {
    step: '4',
    title: 'Consult & recover',
    desc: 'Attend in-person or join a video call. Receive your prescription digitally.',
  },
];

const HowItWorks = () => (
  <section id="how-it-works" className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-20">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">

      {/* Section header */}
      <div className="mb-12">
        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">
          How It Works
        </p>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Up and running in 4 steps
        </h2>
      </div>

      {/* Steps grid */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="hidden lg:block absolute left-0 right-0 top-4.5 h-px bg-linear-to-r from-indigo-200 via-indigo-300 to-indigo-200 dark:from-indigo-900 dark:via-indigo-800 dark:to-indigo-900"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map(({ step, title, desc }) => (
            <div
              key={step}
              className="relative flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700"
            >
            {/* Step badge */}
            <div className="w-9 h-9 rounded-md bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
              {step}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorks;
