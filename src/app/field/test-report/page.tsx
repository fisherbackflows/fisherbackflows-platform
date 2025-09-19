'use client';

import { useState, useEffect } from 'react';
import { FieldNavigation } from '@/components/navigation/UnifiedNavigation';
import { UnifiedPageLayout } from '@/components/ui/UnifiedTheme';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText,
  CheckCircle,
  AlertTriangle,
  Camera,
  Save,
  Send,
  Calendar,
  User,
  MapPin,
  Wrench,
  Gauge,
  Droplets,
  Shield,
  Clock,
  Plus,
  Minus,
  Upload
} from 'lucide-react';

interface TestReading {
  id: string;
  device_location: string;
  test_pressure_psi: number;
  differential_pressure_psi: number;
  test_result: 'pass' | 'fail';
  notes?: string;
}

interface TestReport {
  appointment_id?: string;
  customer_name: string;
  service_address: string;
  test_date: string;
  technician_name: string;
  weather_conditions: string;
  test_readings: TestReading[];
  overall_result: 'pass' | 'fail' | 'needs_repair';
  recommendations?: string;
  photos: File[];
  signature_data?: string;
}

export default function FieldTestReportPage() {
  const [currentReport, setCurrentReport] = useState<TestReport>({
    customer_name: '',
    service_address: '',
    test_date: new Date().toISOString().split('T')[0],
    technician_name: '',
    weather_conditions: 'clear',
    test_readings: [{
      id: '1',
      device_location: '',
      test_pressure_psi: 0,
      differential_pressure_psi: 0,
      test_result: 'pass',
      notes: ''
    }],
    overall_result: 'pass',
    recommendations: '',
    photos: []
  });

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const addTestReading = () => {
    const newReading: TestReading = {
      id: Date.now().toString(),
      device_location: '',
      test_pressure_psi: 0,
      differential_pressure_psi: 0,
      test_result: 'pass',
      notes: ''
    };
    
    setCurrentReport(prev => ({
      ...prev,
      test_readings: [...prev.test_readings, newReading]
    }));
  };

  const removeTestReading = (id: string) => {
    setCurrentReport(prev => ({
      ...prev,
      test_readings: prev.test_readings.filter(reading => reading.id !== id)
    }));
  };

  const updateTestReading = (id: string, field: keyof TestReading, value: any) => {
    setCurrentReport(prev => ({
      ...prev,
      test_readings: prev.test_readings.map(reading =>
        reading.id === id ? { ...reading, [field]: value } : reading
      )
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setCurrentReport(prev => ({
      ...prev,
      photos: [...prev.photos, ...files]
    }));
  };

  const removePhoto = (index: number) => {
    setCurrentReport(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const calculateOverallResult = () => {
    const hasFailures = currentReport.test_readings.some(reading => reading.test_result === 'fail');
    return hasFailures ? 'fail' : 'pass';
  };

  const saveReport = async () => {
    setSaving(true);
    try {
      const reportToSave = {
        ...currentReport,
        overall_result: calculateOverallResult()
      };

      const response = await fetch('/api/field/test-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportToSave)
      });

      if (response.ok) {
        alert('Report saved successfully!');
      } else {
        throw new Error('Failed to save report');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Failed to save report. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const submitReport = async () => {
    setSubmitting(true);
    try {
      const reportToSubmit = {
        ...currentReport,
        overall_result: calculateOverallResult()
      };

      const formData = new FormData();
      formData.append('report', JSON.stringify(reportToSubmit));
      
      currentReport.photos.forEach((photo, index) => {
        formData.append(`photo_${index}`, photo);
      });

      const response = await fetch('/api/field/test-reports/submit', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert('Report submitted successfully!');
        // Reset form or redirect
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getResultColor = (result: string) => {
    const colors = {
      'pass': 'bg-green-500/20 text-green-300 border-green-400',
      'fail': 'bg-red-500/20 text-red-300 border-red-400',
      'needs_repair': 'bg-yellow-500/20 text-yellow-300 border-yellow-400'
    };
    return colors[result as keyof typeof colors] || colors.pass;
  };

  return (
    <UnifiedPageLayout navigation={<FieldNavigation />}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Test Report Form</h1>
          <p className="text-white/70 text-lg">Complete backflow prevention device testing documentation</p>
        </div>

        {/* Customer & Service Information */}
        <Card className="glass border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer & Service Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name" className="text-white/90">Customer Name</Label>
                <Input
                  id="customer_name"
                  value={currentReport.customer_name}
                  onChange={(e) => setCurrentReport(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="glass border-blue-400/50 text-white"
                  placeholder="Enter customer name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="technician_name" className="text-white/90">Technician Name</Label>
                <Input
                  id="technician_name"
                  value={currentReport.technician_name}
                  onChange={(e) => setCurrentReport(prev => ({ ...prev, technician_name: e.target.value }))}
                  className="glass border-blue-400/50 text-white"
                  placeholder="Enter technician name"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="service_address" className="text-white/90">Service Address</Label>
                <Input
                  id="service_address"
                  value={currentReport.service_address}
                  onChange={(e) => setCurrentReport(prev => ({ ...prev, service_address: e.target.value }))}
                  className="glass border-blue-400/50 text-white"
                  placeholder="Enter complete service address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="test_date" className="text-white/90">Test Date</Label>
                <Input
                  id="test_date"
                  type="date"
                  value={currentReport.test_date}
                  onChange={(e) => setCurrentReport(prev => ({ ...prev, test_date: e.target.value }))}
                  className="glass border-blue-400/50 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weather_conditions" className="text-white/90">Weather Conditions</Label>
                <Select 
                  value={currentReport.weather_conditions} 
                  onValueChange={(value) => setCurrentReport(prev => ({ ...prev, weather_conditions: value }))}
                >
                  <SelectTrigger className="glass border-blue-400/50 text-white">
                    <SelectValue placeholder="Select weather" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clear">Clear</SelectItem>
                    <SelectItem value="cloudy">Cloudy</SelectItem>
                    <SelectItem value="rainy">Rainy</SelectItem>
                    <SelectItem value="windy">Windy</SelectItem>
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="cold">Cold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Readings */}
        <Card className="glass border-blue-400/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <Gauge className="h-5 w-5 mr-2" />
                Test Readings
              </CardTitle>
              <Button 
                onClick={addTestReading} 
                size="sm" 
                className="glass-btn-primary hover:glow-blue"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentReport.test_readings.map((reading, index) => (
              <div key={reading.id} className="glass rounded-xl p-4 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Device #{index + 1}
                  </h4>
                  {currentReport.test_readings.length > 1 && (
                    <Button
                      onClick={() => removeTestReading(reading.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                    >
                      <Minus className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/90">Device Location</Label>
                    <Input
                      value={reading.device_location}
                      onChange={(e) => updateTestReading(reading.id, 'device_location', e.target.value)}
                      className="glass border-blue-400/50 text-white"
                      placeholder="e.g. Main water line, Fire system"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/90">Test Pressure (PSI)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={reading.test_pressure_psi}
                      onChange={(e) => updateTestReading(reading.id, 'test_pressure_psi', parseFloat(e.target.value) || 0)}
                      className="glass border-blue-400/50 text-white"
                      placeholder="0.0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/90">Differential Pressure (PSI)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={reading.differential_pressure_psi}
                      onChange={(e) => updateTestReading(reading.id, 'differential_pressure_psi', parseFloat(e.target.value) || 0)}
                      className="glass border-blue-400/50 text-white"
                      placeholder="0.0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/90">Test Result</Label>
                    <Select 
                      value={reading.test_result} 
                      onValueChange={(value) => updateTestReading(reading.id, 'test_result', value)}
                    >
                      <SelectTrigger className="glass border-blue-400/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">Pass</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white/90">Device Notes</Label>
                  <Textarea
                    value={reading.notes}
                    onChange={(e) => updateTestReading(reading.id, 'notes', e.target.value)}
                    className="glass border-blue-400/50 text-white resize-none"
                    placeholder="Any specific notes about this device..."
                    rows={2}
                  />
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <Badge className={`${getResultColor(reading.test_result)} text-sm border`}>
                    {reading.test_result === 'pass' ? (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-1" />
                    )}
                    {reading.test_result.toUpperCase()}
                  </Badge>
                  
                  <div className="text-white/70 text-sm">
                    Pressure differential: {reading.differential_pressure_psi} PSI
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Overall Assessment */}
        <Card className="glass border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Overall Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recommendations" className="text-white/90">Recommendations & Notes</Label>
              <Textarea
                id="recommendations"
                value={currentReport.recommendations}
                onChange={(e) => setCurrentReport(prev => ({ ...prev, recommendations: e.target.value }))}
                className="glass border-blue-400/50 text-white resize-none"
                placeholder="Enter any recommendations, observations, or follow-up actions needed..."
                rows={4}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 font-medium">Overall Test Result:</p>
                <Badge className={`${getResultColor(calculateOverallResult())} text-lg border mt-2`}>
                  {calculateOverallResult() === 'pass' ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 mr-2" />
                  )}
                  {calculateOverallResult().toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card className="glass border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Photos & Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="photos" className="text-white/90">Upload Photos</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="photos"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="glass border-blue-400/50 text-white"
                />
                <Button variant="outline" size="sm" className="glass border-blue-400/50 text-white">
                  <Upload className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              </div>
            </div>
            
            {currentReport.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {currentReport.photos.map((photo, index) => (
                  <div key={index} className="relative glass rounded-lg p-2">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <Button
                      onClick={() => removePhoto(index)}
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 text-red-400 hover:text-red-300 p-1"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <p className="text-white/70 text-xs mt-1 truncate">{photo.name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-4 sticky bottom-6">
          <Button 
            onClick={saveReport}
            disabled={saving}
            variant="outline"
            className="glass border-blue-400/50 text-white hover:bg-blue-500/20"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          
          <Button 
            onClick={submitReport}
            disabled={submitting || !currentReport.customer_name || !currentReport.service_address}
            className="glass-btn-primary hover:glow-blue flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </div>
    </UnifiedPageLayout>
  );
}