import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold text-green-600">
        Welcome to Carbon Credit Buyer
      </h1>
      <p className="text-gray-700">
        Start exploring tokenized carbon credits.
      </p>

      <Link href="/buyer/account">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Go to My Account
        </button>
      </Link>
    </div>
  );
}
