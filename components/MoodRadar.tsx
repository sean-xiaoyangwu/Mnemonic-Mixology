import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { EmotionData } from '../types';

interface MoodRadarProps {
  data: EmotionData;
  color: string;
}

const MoodRadar: React.FC<MoodRadarProps> = ({ data, color }) => {
  const chartData = [
    { subject: 'JOY', A: data.joy, fullMark: 100 },
    { subject: 'MELANCHOLY', A: data.melancholy, fullMark: 100 },
    { subject: 'STRESS', A: data.stress, fullMark: 100 },
    { subject: 'ENERGY', A: data.energy, fullMark: 100 },
    { subject: 'MYSTERY', A: data.mystery, fullMark: 100 },
  ];

  // Use gold as default if color is not provided or too dark
  const strokeColor = '#C5A059'; 

  return (
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="#333" strokeWidth={0.5} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#666', fontSize: 9, fontWeight: 400, letterSpacing: '2px', fontFamily: 'Inter' }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Mood"
            dataKey="A"
            stroke={strokeColor}
            strokeWidth={1}
            fill={strokeColor}
            fillOpacity={0.1}
            isAnimationActive={true}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MoodRadar;