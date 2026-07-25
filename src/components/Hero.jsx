function Hero() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-36">
      <div className="max-w-6xl mx-auto px-6 text-center">

        <h1 className="text-5xl md:text-6xl font-bold">
          Nepal's Smart Vehicle Platform
        </h1>

        <p className="mt-6 text-lg md:text-xl text-blue-100">
          Search vehicle details, verify ownership, report stolen vehicles,
          and access emergency services—all in one place.
        </p>

        <div className="mt-10 flex justify-center">
          <input
            type="text"
            placeholder="Enter Vehicle Number (e.g. BA 2 PA 1234)"
              className="w-full max-w-xl px-6 py-4 rounded-l-xl bg-white text-gray-900 placeholder:text-gray-500 text-lg border-2 border-white focus:outline-none focus:ring-4 focus:ring-yellow-300"
          />

          <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 rounded-r-xl transition duration-300">
            Search
          </button>
        </div>

      </div>
    </section>
  );
}

export default Hero;