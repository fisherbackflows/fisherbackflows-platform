'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Printer,
  Plus,
  Settings,
  FileText,
  Tag
} from 'lucide-react';
import Link from 'next/link';

interface LabelTemplate {
  id: string;
  name: string;
  type: 'address' | 'device' | 'invoice' | 'custom';
  dimensions: string;
  description: string;
}

export default function LabelsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [labelData, setLabelData] = useState({
    customerFilter: 'all',
    includeFields: {
      name: true,
      address: true,
      deviceInfo: false,
      dueDate: false,
      customText: ''
    },
    quantity: 1
  });

  const labelTemplates: LabelTemplate[] = [
    {
      id: 'address-standard',
      name: 'Standard Address Labels',
      type: 'address',
      dimensions: '2.625" x 1"',
      description: 'Standard mailing labels with customer name and address'
    },
    {
      id: 'device-tags',
      name: 'Device ID Tags',
      type: 'device',
      dimensions: '1.5" x 0.5"',
      description: 'Small labels for device identification and QR codes'
    },
    {
      id: 'invoice-labels',
      name: 'Invoice Labels',
      type: 'invoice',
      dimensions: '4" x 2"',
      description: 'Larger labels with customer info and service details'
    },
    {
      id: 'custom-template',
      name: 'Custom Template',
      type: 'custom',
      dimensions: 'Variable',
      description: 'Create your own label format with custom fields'
    }
  ];

  const handlePrint = () => {
    if (!selectedTemplate) {
      alert('Please select a label template');
      return;
    }

    // Mock print process - replace with actual label generation
    console.log('Printing labels:', {
      template: selectedTemplate,
      data: labelData
    });

    alert(`Generating ${labelData.quantity} label(s) using ${labelTemplates.find(t => t.id === selectedTemplate)?.name}`);
  };

  const selectedTemplateInfo = labelTemplates.find(t => t.id === selectedTemplate);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/app/more">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Print Labels</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Label Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">
                <Tag className="h-5 w-5 inline mr-2" />
                Label Template
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {labelTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {template.dimensions}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded capitalize ${
                        template.type === 'address' ? 'bg-blue-100 text-blue-700' :
                        template.type === 'device' ? 'bg-green-100 text-green-700' :
                        template.type === 'invoice' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {template.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Filter */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Customer Selection</h2>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="customerFilter"
                    value="all"
                    checked={labelData.customerFilter === 'all'}
                    onChange={(e) => setLabelData(prev => ({ ...prev, customerFilter: e.target.value }))}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700">All Customers</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="customerFilter"
                    value="active"
                    checked={labelData.customerFilter === 'active'}
                    onChange={(e) => setLabelData(prev => ({ ...prev, customerFilter: e.target.value }))}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700">Active Customers Only</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="customerFilter"
                    value="due-soon"
                    checked={labelData.customerFilter === 'due-soon'}
                    onChange={(e) => setLabelData(prev => ({ ...prev, customerFilter: e.target.value }))}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700">Testing Due Soon</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="customerFilter"
                    value="custom"
                    checked={labelData.customerFilter === 'custom'}
                    onChange={(e) => setLabelData(prev => ({ ...prev, customerFilter: e.target.value }))}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700">Custom Selection</span>
                </label>
              </div>
            </div>

            {/* Label Content */}
            {selectedTemplate && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">
                  <Settings className="h-5 w-5 inline mr-2" />
                  Label Content
                </h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={labelData.includeFields.name}
                        onChange={(e) => setLabelData(prev => ({
                          ...prev,
                          includeFields: { ...prev.includeFields, name: e.target.checked }
                        }))}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Customer Name</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={labelData.includeFields.address}
                        onChange={(e) => setLabelData(prev => ({
                          ...prev,
                          includeFields: { ...prev.includeFields, address: e.target.checked }
                        }))}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Address</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={labelData.includeFields.deviceInfo}
                        onChange={(e) => setLabelData(prev => ({
                          ...prev,
                          includeFields: { ...prev.includeFields, deviceInfo: e.target.checked }
                        }))}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Device Info</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={labelData.includeFields.dueDate}
                        onChange={(e) => setLabelData(prev => ({
                          ...prev,
                          includeFields: { ...prev.includeFields, dueDate: e.target.checked }
                        }))}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Due Date</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Text (Optional)
                    </label>
                    <textarea
                      value={labelData.includeFields.customText}
                      onChange={(e) => setLabelData(prev => ({
                        ...prev,
                        includeFields: { ...prev.includeFields, customText: e.target.value }
                      }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add custom text to appear on all labels..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Labels per Customer
                      </label>
                      <input
                        type="number"
                        value={labelData.quantity}
                        onChange={(e) => setLabelData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                        min="1"
                        max="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview and Print */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">
                <FileText className="h-5 w-5 inline mr-2" />
                Label Preview
              </h2>
              
              {selectedTemplateInfo ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
                    <div className="text-center">
                      <h3 className="font-medium text-gray-900 text-sm">Preview</h3>
                      <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
                        {labelData.includeFields.name && <div className="font-medium">John Smith</div>}
                        {labelData.includeFields.address && (
                          <div className="mt-1">
                            123 Main St<br />
                            Tacoma, WA 98401
                          </div>
                        )}
                        {labelData.includeFields.deviceInfo && (
                          <div className="mt-1 text-gray-600">
                            RPZ Device #12345
                          </div>
                        )}
                        {labelData.includeFields.dueDate && (
                          <div className="mt-1 text-gray-600">
                            Due: 2024-12-15
                          </div>
                        )}
                        {labelData.includeFields.customText && (
                          <div className="mt-2 text-gray-600 italic">
                            {labelData.includeFields.customText}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Template:</span>
                      <p className="text-gray-600">{selectedTemplateInfo.name}</p>
                    </div>
                    <div>
                      <span className="font-medium">Size:</span>
                      <p className="text-gray-600">{selectedTemplateInfo.dimensions}</p>
                    </div>
                    <div>
                      <span className="font-medium">Filter:</span>
                      <p className="text-gray-600 capitalize">
                        {labelData.customerFilter.replace('-', ' ')}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Quantity:</span>
                      <p className="text-gray-600">{labelData.quantity} per customer</p>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button 
                      onClick={handlePrint}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Labels
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => alert('Label template saved for future use')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Save Template
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a template to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}