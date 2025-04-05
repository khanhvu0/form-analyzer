import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

interface KeyMoment {
  frame: number;
  timestamp: number;
  label: string;
  confidence: number;
}

interface KeyMomentsProps {
  moments: KeyMoment[];
  onMomentClick: (timestamp: number) => void;
}

const KeyMoments: React.FC<KeyMomentsProps> = ({ moments, onMomentClick }) => {
  // Sort moments in chronological order (newest first)
  const sortedMoments = moments.sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="mt-4 mb-8">
      <h2 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        Key Moments
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        {sortedMoments.map((moment, index) => (
          <Card
            key={index}
            onClick={() => onMomentClick(moment.timestamp)}
            className="cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-lg"
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-lg font-semibold">
                  {moment.label}
                </CardTitle>
                <Badge
                  variant={moment.confidence > 0.7 ? "success" : moment.confidence > 0.4 ? "warning" : "destructive"}
                  className="min-w-[60px] text-xs font-medium h-6"
                >
                  {(moment.confidence * 100).toFixed(0)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Time: {moment.timestamp.toFixed(2)}s
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default KeyMoments; 