import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mb-5">
        <Compass className="w-10 h-10" />
      </div>
      <h1 className="text-4xl font-extrabold text-brand-950">404</h1>
      <p className="text-slate-500 mt-2 max-w-sm">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}
