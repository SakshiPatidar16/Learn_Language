function FrontPage() {
  const items = [
    {
      name: "Java",
      description: "Popular in enterprise software, backend systems, and Android apps."
    },
    {
      name: "Python",
      description: "Excellent for beginners, scripting, web development, and data science."
    },
    {
      name: "JavaScript",
      description: "Main language for modern web interfaces and full-stack development."
    },
    {
      name: "C++",
      description: "Used for high-performance software such as game engines and systems apps."
    }
  ];

  return (
    <section className="w-full max-w-3xl mt-6 bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-slate-800">Programming Languages Portal</h2>
      <p className="text-sm text-slate-600 mt-2">
        Users can view all language details. Admin can add, edit, and delete entries.
      </p>

      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        {items.map((item) => (
          <article key={item.name} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <h3 className="font-semibold text-slate-800">{item.name}</h3>
            <p className="text-sm text-slate-600 mt-1">{item.description}</p>
          </article>
        ))}
      </div>

      <p className="text-xs text-sky-900 bg-sky-100 rounded-lg px-3 py-2 mt-4">
        Admin login: admin123@yopmail.com with password Admin@123
      </p>
    </section>
  );
}

export default FrontPage;