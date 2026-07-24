function Hero() {
  return (
    <section className="text-center py-24">

      <h1 className="text-6xl font-bold text-slate-800">
        Nepal's Smart Vehicle Platform
      </h1>

      <p className="text-gray-600 mt-6 text-xl">
        Search, Verify and Manage Vehicles Easily
      </p>

      <div className="mt-10">

        <input
          type="text"
          placeholder="Enter Vehicle Number"
          className="border border-gray-300 rounded-lg p-4 w-96 shadow-md"
        />

      </div>

      <button className="mt-6 bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition">

        Search Vehicle

      </button>

    </section>
  );
}

export default Hero;