import React from 'react';

interface Props {
  title: string;
  subtitle: string;
}

const DocumentCard = ({ title, subtitle }: Props) => {
  return (
    <div className="w-48 bg-white border border-gray-200 rounded-xl shadow-sm p-2 flex flex-col">
      <div className="h-24 bg-gray-100 rounded mb-2" />
      <p className="text-sm font-semibold text-blue-600 line-clamp-2">{title}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      <button className="text-xs text-blue-500 mt-2 hover:underline">Save</button>
    </div>
  );
};

export default DocumentCard;
