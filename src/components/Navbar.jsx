function Navbar() {
  return (
    <nav className="bg-blue-600 text-white px-8 py-4 flex justify-between items-center">
      <div className="text-2xl font-bold">
        🚗 SawariSathi
      </div>

      <ul className="flex gap-8 font-medium">
        <li className="cursor-pointer hover:text-gray-200">Home</li>
        <li className="cursor-pointer hover:text-gray-200">Vehicle Lookup</li>
        <li className="cursor-pointer hover:text-gray-200">Services</li>
        <li className="cursor-pointer hover:text-gray-200">About</li>
        <li className="cursor-pointer hover:text-gray-200">Login</li>
      </ul>
    </nav>
  );
}

export default Navbar;