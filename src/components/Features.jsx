function Features() {
  const services = [
    {
      icon: "🚗",
      title: "Vehicle Lookup",
      description: "Search vehicle details quickly and securely."
    },
    {
      icon: "🛡️",
      title: "Verification",
      description: "Verify vehicle ownership and information."
    },
    {
      icon: "🚨",
      title: "Emergency SOS",
      description: "Find nearby police, ambulance and garages."
    },
    {
      icon: "📄",
      title: "Documents",
      description: "Manage insurance and bluebook information."
    }
  ];

  return (
    <section className="py-20 bg-gray-100">
      <h2 className="text-4xl font-bold text-center mb-12">
        Our Services
      </h2>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-6">
        {services.map((service, index) => (
          <div
            key={index}
          className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
          >
            <div className="text-5xl mb-4">{service.icon}</div>

            <h3 className="text-xl font-bold mb-3">
              {service.title}
            </h3>

            <p className="text-gray-600">
              {service.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Features;