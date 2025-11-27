/**
 * Green AI Solar - Main Application with Efficiency Evolution
 * ===========================================================
 * Interface de prédiction avec évolution de l'efficacité au fil des années
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Zap, Wind, Thermometer, Droplets, Cloud, Gauge, Activity, 
  Leaf, ChevronRight, BarChart3, Info, RefreshCw, AlertCircle,
  CheckCircle, Sparkles, TrendingUp, Settings, History, TrendingDown,
  Calendar, LineChart as LineChartIcon, ArrowRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Area, AreaChart, CartesianGrid, Legend,
  ComposedChart, ReferenceLine
} from 'recharts';
import { solarApi, simulateLocally } from './services/api';

// ============================================
// Configuration des Features
// ============================================

const FEATURES_CONFIG = [
  {
    key: 'irradiance',
    label: 'Irradiance solaire',
    unit: 'W/m²',
    min: 0,
    max: 1200,
    step: 10,
    default: 500,
    icon: Sun,
    gradient: 'from-amber-400 to-orange-500',
    description: 'Puissance du rayonnement solaire',
    color: '#f59e0b'
  },
  {
    key: 'soiling_ratio',
    label: 'Ratio de propreté',
    unit: '',
    min: 0.3,
    max: 1,
    step: 0.01,
    default: 0.7,
    icon: Sparkles,
    gradient: 'from-emerald-400 to-green-500',
    description: '1 = parfaitement propre',
    color: '#22c55e'
  },
  {
    key: 'panel_age',
    label: 'Âge du panneau',
    unit: 'ans',
    min: 0,
    max: 35,
    step: 1,
    default: 10,
    icon: Gauge,
    gradient: 'from-blue-400 to-indigo-500',
    description: 'Années depuis l\'installation',
    color: '#3b82f6'
  },
  {
    key: 'temperature',
    label: 'Température ambiante',
    unit: '°C',
    min: -10,
    max: 50,
    step: 1,
    default: 25,
    icon: Thermometer,
    gradient: 'from-red-400 to-rose-500',
    description: 'Température de l\'air extérieur',
    color: '#ef4444'
  },
  {
    key: 'humidity',
    label: 'Humidité',
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
    default: 50,
    icon: Droplets,
    gradient: 'from-cyan-400 to-blue-500',
    description: 'Humidité relative de l\'air',
    color: '#06b6d4'
  },
  {
    key: 'cloud_coverage',
    label: 'Couverture nuageuse',
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
    default: 30,
    icon: Cloud,
    gradient: 'from-gray-400 to-slate-500',
    description: 'Pourcentage du ciel couvert',
    color: '#64748b'
  },
  {
    key: 'module_temperature',
    label: 'Température module',
    unit: '°C',
    min: 0,
    max: 65,
    step: 1,
    default: 35,
    icon: Zap,
    gradient: 'from-purple-400 to-violet-500',
    description: 'Température du panneau',
    color: '#8b5cf6'
  },
  {
    key: 'wind_speed',
    label: 'Vitesse du vent',
    unit: 'm/s',
    min: 0,
    max: 15,
    step: 0.5,
    default: 7,
    icon: Wind,
    gradient: 'from-teal-400 to-cyan-500',
    description: 'Refroidissement du panneau',
    color: '#14b8a6'
  },
];

const ADDITIONAL_FEATURES = [
  { key: 'voltage', default: 30 },
  { key: 'current', default: 2 },
  { key: 'pressure', default: 1013 },
  { key: 'maintenance_count', default: 3 },
];

const FEATURE_IMPORTANCE = [
  { name: 'Irradiance', value: 0.669, color: '#f59e0b' },
  { name: 'Propreté', value: 0.229, color: '#22c55e' },
  { name: 'Âge panneau', value: 0.078, color: '#3b82f6' },
  { name: 'Humidité', value: 0.011, color: '#06b6d4' },
  { name: 'Temp. module', value: 0.005, color: '#8b5cf6' },
  { name: 'Température', value: 0.003, color: '#ef4444' },
];

// ============================================
// Génération de l'évolution sur les années
// ============================================

const generateYearlyEvolution = (baseInputs, maxYears = 35) => {
  const data = [];
  
  for (let year = 0; year <= maxYears; year++) {
    const inputs = {
      ...baseInputs,
      panel_age: year
    };
    
    const result = simulateLocally.predict(inputs);
    const efficiency = result.efficiency * 100;
    
    // Calcul de la production annuelle estimée (kWh pour un panneau de 400W)
    const panelPower = 400; // Watts
    const sunHoursPerYear = 1500; // Heures d'ensoleillement moyen/an
    const annualProduction = (panelPower * sunHoursPerYear * result.efficiency) / 1000;
    
    // Perte par rapport à l'année 0
    const initialEfficiency = year === 0 ? efficiency : data[0].efficiency;
    const degradation = ((initialEfficiency - efficiency) / initialEfficiency) * 100;
    
    data.push({
      year,
      yearLabel: `Année ${year}`,
      efficiency: Math.round(efficiency * 10) / 10,
      production: Math.round(annualProduction),
      degradation: Math.round(degradation * 10) / 10,
      // Pour le tooltip
      status: efficiency >= 60 ? 'Bon' : efficiency >= 45 ? 'Acceptable' : 'À remplacer'
    });
  }
  
  return data;
};

// Générer les prédictions pour différents scénarios de maintenance
const generateMaintenanceComparison = (baseInputs) => {
  const scenarios = [
    { name: 'Sans entretien', soilingDecay: 0.015, maintenanceBonus: 0 },      // Perd 1.5% propreté/an
    { name: 'Entretien minimal', soilingDecay: 0.008, maintenanceBonus: 0.002 }, // Perd 0.8% propreté/an
    { name: 'Entretien régulier', soilingDecay: 0.003, maintenanceBonus: 0.005 }, // Perd 0.3% propreté/an
    { name: 'Entretien optimal', soilingDecay: 0, maintenanceBonus: 0.008 },    // Maintient la propreté
  ];
  
  const years = [0, 5, 10, 15, 20, 25, 30];
  
  // Calculer l'efficacité initiale (année 0) - même pour tous
  const initialInputs = {
    ...baseInputs,
    panel_age: 0,
    soiling_ratio: 0.85, // Tous partent avec la même propreté
    maintenance_count: 0
  };
  const initialResult = simulateLocally.predict(initialInputs);
  const initialEfficiency = Math.round(initialResult.efficiency * 1000) / 10;
  
  return years.map(year => {
    const dataPoint = { year: `${year} ans` };
    
    if (year === 0) {
      // Année 0 : tout le monde part de la même valeur
      scenarios.forEach(scenario => {
        dataPoint[scenario.name] = initialEfficiency;
      });
    } else {
      scenarios.forEach(scenario => {
        // Calculer la propreté qui se dégrade avec le temps (mais pas en dessous de 0.4)
        const soilingAfterYears = Math.max(0.4, 0.85 - (scenario.soilingDecay * year));
        
        // Bonus de maintenance qui compense légèrement le vieillissement
        const inputs = {
          ...baseInputs,
          panel_age: year,
          soiling_ratio: soilingAfterYears,
          maintenance_count: Math.min(year, 10) // Max 10 maintenances
        };
        
        let result = simulateLocally.predict(inputs);
        // Appliquer un petit bonus pour l'entretien régulier
        let efficiency = result.efficiency + (scenario.maintenanceBonus * year);
        efficiency = Math.min(efficiency, initialResult.efficiency); // Ne pas dépasser l'initial
        
        dataPoint[scenario.name] = Math.round(efficiency * 1000) / 10;
      });
    }
    
    return dataPoint;
  });
};

// ============================================
// Composants UI
// ============================================

const InputSlider = ({ config, value, onChange }) => {
  const Icon = config.icon;
  
  return (
    <motion.div 
      className="group bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-300"
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl bg-gradient-to-br ${config.gradient} text-white shadow-lg`}>
            <Icon size={16} />
          </div>
          <span className="text-sm font-semibold text-gray-800">{config.label}</span>
        </div>
        <div className="text-right">
          <span className="text-base font-bold text-gray-900">
            {config.step < 1 ? value.toFixed(2) : value}
          </span>
          <span className="text-xs text-gray-500 ml-1">{config.unit}</span>
        </div>
      </div>
      
      <input
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{config.min}</span>
        <span>{config.max}</span>
      </div>
    </motion.div>
  );
};

const EfficiencyGauge = ({ value, isLoading }) => {
  const percentage = value * 100;
  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (percentage / 100) * circumference * 0.75;
  
  const getColor = () => {
    if (percentage < 30) return { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' };
    if (percentage < 50) return { main: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' };
    if (percentage < 70) return { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.3)' };
    return { main: '#10b981', glow: 'rgba(16, 185, 129, 0.3)' };
  };

  const getLabel = () => {
    if (percentage < 30) return { text: 'Faible', emoji: '⚠️' };
    if (percentage < 50) return { text: 'Modérée', emoji: '📊' };
    if (percentage < 70) return { text: 'Bonne', emoji: '✅' };
    return { text: 'Excellente', emoji: '🌟' };
  };

  const color = getColor();
  const label = getLabel();

  return (
    <div className="relative flex flex-col items-center py-4">
      <div 
        className="absolute inset-0 blur-3xl opacity-30 transition-all duration-500"
        style={{ backgroundColor: color.glow }}
      />
      
      <svg viewBox="0 0 200 130" className="w-56 h-36 relative z-10">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="33%" stopColor="#f59e0b" />
            <stop offset="66%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="14"
          strokeLinecap="round"
        />
        
        <motion.path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference * 0.75}
          initial={{ strokeDashoffset: circumference * 0.75 }}
          animate={{ strokeDashoffset: isLoading ? circumference * 0.75 : offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          filter="url(#glow)"
        />
        
        <circle cx="100" cy="100" r="10" fill={color.main} />
        <circle cx="100" cy="100" r="5" fill="white" />
      </svg>
      
      <motion.div 
        className="text-center -mt-2 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="text-4xl font-bold" style={{ color: color.main }}>
          {isLoading ? '—' : percentage.toFixed(1)}
          <span className="text-xl">%</span>
        </div>
        <div 
          className="inline-flex items-center gap-2 text-sm font-medium mt-1 px-3 py-1 rounded-full"
          style={{ backgroundColor: `${color.main}15`, color: color.main }}
        >
          <span>{label.emoji}</span>
          <span>{label.text}</span>
        </div>
      </motion.div>
    </div>
  );
};

// ============================================
// Graphiques d'évolution
// ============================================

const EfficiencyEvolutionChart = ({ data, currentAge }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
        <defs>
          <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="year" 
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          label={{ value: 'Années', position: 'bottom', fontSize: 12, fill: '#9ca3af' }}
        />
        <YAxis 
          domain={[30, 80]}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Efficacité (%)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#6b7280' }}
        />
        <Tooltip 
          contentStyle={{ 
            borderRadius: '12px', 
            border: 'none', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            padding: '12px'
          }}
          formatter={(value, name) => {
            if (name === 'efficiency') return [`${value}%`, 'Efficacité'];
            return [value, name];
          }}
          labelFormatter={(label) => `Année ${label}`}
        />
        
        {/* Ligne de référence pour l'âge actuel */}
        <ReferenceLine 
          x={currentAge} 
          stroke="#ef4444" 
          strokeWidth={2}
          strokeDasharray="5 5"
          label={{ value: 'Actuel', position: 'top', fill: '#ef4444', fontSize: 11 }}
        />
        
        {/* Seuil minimal */}
        <ReferenceLine 
          y={50} 
          stroke="#f59e0b" 
          strokeDasharray="3 3"
          label={{ value: 'Seuil minimal', position: 'right', fill: '#f59e0b', fontSize: 10 }}
        />
        
        <Area
          type="monotone"
          dataKey="efficiency"
          stroke="#10b981"
          fill="url(#efficiencyGradient)"
          strokeWidth={3}
          name="Efficacité"
          dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
          activeDot={{ r: 6, fill: '#10b981' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const MaintenanceComparisonChart = ({ data }) => {
  const colors = {
    'Sans entretien': '#ef4444',
    'Entretien minimal': '#f59e0b',
    'Entretien régulier': '#22c55e',
    'Entretien optimal': '#10b981',
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="year" 
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
        />
        <YAxis 
          domain={[20, 80]}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Efficacité (%)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#6b7280' }}
        />
        <Tooltip 
          contentStyle={{ 
            borderRadius: '12px', 
            border: 'none', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            padding: '12px'
          }}
          formatter={(value) => [`${value}%`, '']}
        />
        <Legend verticalAlign="top" height={36} />
        
        {Object.keys(colors).map(scenario => (
          <Line
            key={scenario}
            type="monotone"
            dataKey={scenario}
            stroke={colors[scenario]}
            strokeWidth={2}
            dot={{ fill: colors[scenario], r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

const DegradationStats = ({ data, currentAge }) => {
  const currentData = data.find(d => d.year === currentAge) || data[0];
  const initialData = data[0];
  const year10Data = data.find(d => d.year === 10) || data[10];
  const year25Data = data.find(d => d.year === 25) || data[25];
  
  const avgDegradationPerYear = currentAge > 0 
    ? ((initialData.efficiency - currentData.efficiency) / currentAge).toFixed(2)
    : 0;
  
  // Estimation de la durée de vie (quand efficacité < 50%)
  const lifeExpectancy = data.findIndex(d => d.efficiency < 50);
  const yearsRemaining = lifeExpectancy > currentAge ? lifeExpectancy - currentAge : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={18} className="text-emerald-600" />
          <span className="text-xs text-gray-500">Efficacité actuelle</span>
        </div>
        <div className="text-2xl font-bold text-emerald-600">{currentData.efficiency}%</div>
        <div className="text-xs text-gray-400 mt-1">À {currentAge} ans</div>
      </div>
      
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown size={18} className="text-red-500" />
          <span className="text-xs text-gray-500">Dégradation</span>
        </div>
        <div className="text-2xl font-bold text-red-500">-{currentData.degradation}%</div>
        <div className="text-xs text-gray-400 mt-1">≈ {avgDegradationPerYear}%/an</div>
      </div>
      
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={18} className="text-blue-600" />
          <span className="text-xs text-gray-500">Durée de vie estimée</span>
        </div>
        <div className="text-2xl font-bold text-blue-600">{lifeExpectancy > 0 ? lifeExpectancy : '35+'} ans</div>
        <div className="text-xs text-gray-400 mt-1">{yearsRemaining > 0 ? `${yearsRemaining} ans restants` : 'À remplacer'}</div>
      </div>
      
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sun size={18} className="text-amber-600" />
          <span className="text-xs text-gray-500">Production annuelle</span>
        </div>
        <div className="text-2xl font-bold text-amber-600">{currentData.production}</div>
        <div className="text-xs text-gray-400 mt-1">kWh/an (panneau 400W)</div>
      </div>
    </div>
  );
};

const FeatureImportanceChart = ({ isOpen, onToggle }) => {
  return (
    <motion.div 
      className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100 overflow-hidden"
      layout
    >
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
            <BarChart3 size={16} />
          </div>
          <span className="font-semibold text-gray-800">Importance des variables</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight size={20} className="text-gray-400" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 pb-4"
          >
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={FEATURE_IMPORTANCE} layout="vertical" margin={{ left: 10 }}>
                  <XAxis 
                    type="number" 
                    domain={[0, 0.7]} 
                    tickFormatter={(v) => `${(v*100).toFixed(0)}%`}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={70} 
                    tick={{ fontSize: 11, fill: '#374151' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${(value*100).toFixed(1)}%`, 'Importance']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {FEATURE_IMPORTANCE.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const StatusBadge = ({ apiStatus }) => {
  const isConnected = apiStatus === 'connected';
  
  return (
    <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full ${
      isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
    }`}>
      {isConnected ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
      <span>{isConnected ? 'API connectée' : 'Mode simulation'}</span>
    </div>
  );
};

// ============================================
// Application Principale
// ============================================

export default function App() {
  const [inputs, setInputs] = useState(() => {
    const initial = {};
    FEATURES_CONFIG.forEach(f => initial[f.key] = f.default);
    ADDITIONAL_FEATURES.forEach(f => initial[f.key] = f.default);
    return initial;
  });
  
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const [showImportance, setShowImportance] = useState(false);
  const [error, setError] = useState(null);
  
  // Données d'évolution
  const [evolutionData, setEvolutionData] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [activeTab, setActiveTab] = useState('predict');

  useEffect(() => {
    const checkApi = async () => {
      try {
        await solarApi.healthCheck();
        setApiStatus('connected');
      } catch {
        setApiStatus('disconnected');
      }
    };
    checkApi();
  }, []);

  // Générer les données d'évolution quand les inputs changent
  useEffect(() => {
    const evolution = generateYearlyEvolution(inputs);
    setEvolutionData(evolution);
    
    const maintenance = generateMaintenanceComparison(inputs);
    setMaintenanceData(maintenance);
  }, [inputs]);

  const handlePredict = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let result;
      if (apiStatus === 'connected') {
        result = await solarApi.predict(inputs);
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
        result = simulateLocally.predict(inputs);
      }
      setPrediction(result);
    } catch (err) {
      setError(err.message);
      const result = simulateLocally.predict(inputs);
      setPrediction(result);
    } finally {
      setIsLoading(false);
    }
  }, [inputs, apiStatus]);

  useEffect(() => {
    handlePredict();
  }, []);

  const updateInput = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-emerald-100/50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="p-2.5 bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 rounded-xl shadow-lg shadow-amber-200/50"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sun className="text-white" size={24} />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Green AI Solar
                </h1>
                <p className="text-xs text-gray-500">Prédiction & Évolution</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <StatusBadge apiStatus={apiStatus} />
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                <TrendingUp size={14} className="text-emerald-500" />
                <span>R² = <strong className="text-gray-700">0.814</strong></span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 p-1 bg-white/60 backdrop-blur-sm rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('predict')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'predict'
                ? 'bg-white text-emerald-600 shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Zap size={18} />
            Prédiction
          </button>
          <button
            onClick={() => setActiveTab('evolution')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'evolution'
                ? 'bg-white text-emerald-600 shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingDown size={18} />
            Évolution dans le temps
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-8 relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'predict' ? (
            <motion.div
              key="predict"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid lg:grid-cols-3 gap-6"
            >
              {/* Input Panel */}
              <div className="lg:col-span-2">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-100/50 p-5 border border-white/50">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <Settings size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-800">Paramètres du panneau</h2>
                      <p className="text-xs text-gray-400">Ajustez les valeurs pour prédire</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-3">
                    {FEATURES_CONFIG.map((config) => (
                      <InputSlider
                        key={config.key}
                        config={config}
                        value={inputs[config.key]}
                        onChange={(v) => updateInput(config.key, v)}
                      />
                    ))}
                  </div>

                  <motion.button
                    onClick={handlePredict}
                    disabled={isLoading}
                    className="w-full mt-6 py-3.5 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 
                             text-white font-semibold rounded-xl shadow-lg shadow-emerald-300/50
                             disabled:opacity-50 flex items-center justify-center gap-3"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={20} className="animate-spin" />
                        Calcul...
                      </>
                    ) : (
                      <>
                        <Zap size={20} />
                        Prédire l'efficacité
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Results Panel */}
              <div className="space-y-4">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-100/50 p-5 border border-white/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={18} className="text-amber-500" />
                    <h2 className="font-bold text-gray-800">Efficacité prédite</h2>
                  </div>
                  <EfficiencyGauge value={prediction?.efficiency || 0} isLoading={isLoading} />
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <Info size={16} />
                      <span>Âge actuel du panneau : <strong>{inputs.panel_age} ans</strong></span>
                    </div>
                  </div>
                </div>

                <FeatureImportanceChart isOpen={showImportance} onToggle={() => setShowImportance(!showImportance)} />

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-gray-100 text-center">
                    <div className="text-xl font-bold text-emerald-600">81.4%</div>
                    <div className="text-xs text-gray-500">Précision R²</div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-gray-100 text-center">
                    <div className="text-xl font-bold text-blue-600">0.002</div>
                    <div className="text-xs text-gray-500">Erreur MSE</div>
                  </div>
                </div>
                
                {/* Bouton vers évolution */}
                <button
                  onClick={() => setActiveTab('evolution')}
                  className="w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 
                           hover:border-blue-200 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingDown size={20} className="text-blue-500" />
                      <div className="text-left">
                        <div className="font-semibold text-gray-800">Voir l'évolution</div>
                        <div className="text-xs text-gray-500">Dégradation sur 35 ans</div>
                      </div>
                    </div>
                    <ArrowRight size={20} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="evolution"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Header */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Évolution de l'efficacité au fil des années</h2>
                <p className="text-gray-500 mt-1">Simulation de la dégradation du panneau sur 35 ans</p>
              </div>

              {/* Main Evolution Chart */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-100/50 p-6 border border-white/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl text-white">
                    <LineChartIcon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Courbe de dégradation</h3>
                    <p className="text-xs text-gray-400">Efficacité et production annuelle estimée</p>
                  </div>
                </div>

                <EfficiencyEvolutionChart data={evolutionData} currentAge={inputs.panel_age} />
                
                <DegradationStats data={evolutionData} currentAge={inputs.panel_age} />
              </div>

              {/* Maintenance Comparison */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-100/50 p-6 border border-white/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl text-white">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Impact de l'entretien</h3>
                    <p className="text-xs text-gray-400">Comparaison de différents niveaux de maintenance</p>
                  </div>
                </div>

                <MaintenanceComparisonChart data={maintenanceData} />
                
                <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Info size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-600">
                      <strong className="text-amber-700">💡 Conseil :</strong> Un entretien régulier (nettoyage, vérification) 
                      peut prolonger significativement la durée de vie de vos panneaux et maintenir une efficacité élevée.
                    </div>
                  </div>
                </div>
              </div>

              {/* Parameters used */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Settings size={18} className="text-gray-500" />
                  Paramètres de simulation
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {FEATURES_CONFIG.filter(c => c.key !== 'panel_age').slice(0, 4).map(config => {
                    const Icon = config.icon;
                    return (
                      <div key={config.key} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${config.gradient} text-white`}>
                          <Icon size={14} />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">{config.label}</div>
                          <div className="font-semibold text-gray-800">
                            {config.step < 1 ? inputs[config.key].toFixed(2) : inputs[config.key]}{config.unit}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  💡 Modifiez les paramètres dans l'onglet "Prédiction" pour voir l'impact sur l'évolution
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-emerald-100/50 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <span>Green AI Solar • FastAPI + React • Modèle GradientBoosting R²=0.814</span>
        </div>
      </footer>
    </div>
  );
}
