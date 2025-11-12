import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";

const EstadisticasCard = ({ title, items }) => {
  return (
    <Card className="card">
      <CardHeader className="card-header">
        <h4>{title}</h4>
      </CardHeader>
      <CardBody className="card-body">
        {items && items.map((item, index) => (
          <div 
            key={index} 
            className={`card-item ${item.highlight ? 'highlight' : ''}`}
          >
            <span className="card-label">{item.label}</span>
            <span className={`card-value ${item.highlight ? 'highlight-value' : ''}`}>
              {item.value}
            </span>
          </div>
        ))}
      </CardBody>
    </Card>
  );
};

export default EstadisticasCard;
