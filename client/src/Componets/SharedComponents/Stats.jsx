const STATS = [
  { value: '50,000+', label: 'Patients served'        },
  { value: '1,200+',  label: 'Verified doctors'       },
  { value: '98%',     label: 'Satisfaction rate'      },
  { value: '24 / 7',  label: 'Platform availability'  },
];

const Stats = () => (
  <section id="stats" className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-16">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-md overflow-hidden">
        {STATS.map(({ value, label }) => (
          <div key={label} className="p-6 text-center bg-white dark:bg-gray-900">
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Stats;
