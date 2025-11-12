import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";

interface ServiceCardItem {
  label: string;
  value: string;
}

interface ServiceCardProps {
  title: string;
  items: ServiceCardItem[];
  className?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ title, items, className }) => {
  return (
    <Card className={`${className} overflow-hidden shadow-lg`}>
      <CardHeader className="pb-0 pt-3 px-5 flex flex-col items-start"> 
        <h4 className="text-xl font-bold text-black border-b-2 border-red-300 w-full pb-2">
          {title}
        </h4>
      </CardHeader>
      <CardBody className="py-3 px-5"> 
        {items.map((item, index) => (
          <div key={index} className="card-item">
            <span className="font-semibold text-black">{item.label}</span>
            <span className="text-gray-800">{item.value}</span>
          </div>
        ))}
      </CardBody>
    </Card>
  );
};