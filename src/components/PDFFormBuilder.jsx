import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, Download, Type, Trash2, Move, ZoomIn, ZoomOut, 
  FileText, Save, AlertCircle, CheckCircle2
} from 'lucide-react';
import GlassCard from './GlassCard';

export default function PDFFormBuilder({ visaType }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const canvasRef = useRef(null);
  const iframeRef = useRef(null);

  // Official Thai Immigration forms
  const officialForms = [
    { name: 'TM.7 - Visa Extension Application', url: '/forms/TM7.pdf' },
    { name: 'TM.8 - Re-Entry Permit', url: '/forms/TM8.pdf' },
    { name: 'TM.47 - 90-Day Report', url: '/forms/TM47.pdf' },
    { name: 'TM.30 - Notification of Residence', url: '/forms/TM30.pdf' },
    { name: 'STM.2 - Visa Application (Embassy)', url: '/forms/STM2.pdf' }
  ];

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setUploading(true);
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      setPdfUrl(response.file_url);
      setFields([]);
      setPdfLoaded(false);
    } catch (error) {
      alert('Failed to upload PDF: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Load PDF in iframe when URL changes
  useEffect(() => {
    if (pdfUrl && iframeRef.current) {
      setPdfLoaded(false);
      iframeRef.current.onload = () => {
        setPdfLoaded(true);
      };
    }
  }, [pdfUrl]);

  const addTextField = () => {
    const newField = {
      id: Date.now(),
      type: 'text',
      x: 50,
      y: 50,
      width: 200,
      height: 30,
      value: '',
      fontSize: 14,
      color: '#0066cc',
      fontFamily: 'Segoe UI, Arial, sans-serif'
    };
    setFields([...fields, newField]);
    setSelectedField(newField.id);
  };

  const updateField = (id, updates) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteField = (id) => {
    setFields(fields.filter(f => f.id !== id));
    if (selectedField === id) setSelectedField(null);
  };

  const handleFieldDragStart = (id) => {
    setSelectedField(id);
    setIsDragging(true);
  };

  const handleFieldDrag = (e, id) => {
    if (!isDragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    updateField(id, { x, y });
  };

  const handleFieldDragEnd = () => {
    setIsDragging(false);
  };

  const generatePDF = async () => {
    if (!pdfUrl || fields.length === 0) {
      alert('Please add some fields to the form first');
      return;
    }

    try {
      const response = await base44.functions.invoke('generateFilledPDF', {
        pdf_url: pdfUrl,
        fields: fields
      });

      // Create download link
      const link = document.createElement('a');
      link.href = response.data.filled_pdf_url;
      link.download = `filled-form-${visaType || 'visa'}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('Failed to generate PDF: ' + error.message);
    }
  };

  const saveTemplate = async () => {
    if (!pdfUrl || fields.length === 0) {
      alert('Please add some fields before saving template');
      return;
    }

    try {
      await base44.entities.FormTemplate.create({
        visa_type: visaType || 'general',
        form_name: 'Custom Form',
        pdf_url: pdfUrl,
        fields: fields
      });
      alert('Template saved successfully!');
    } catch (error) {
      alert('Failed to save template: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">PDF Form Builder</h2>
        <p className="text-gray-600 text-sm mb-6">
          Upload an official Thai Immigration form or select from our library, then fill it out digitally with clean, blue pen style text.
        </p>

        {!pdfUrl && (
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 mb-2 block font-medium">Upload Your Own Form</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors bg-gradient-to-br from-blue-50 to-cyan-50 cursor-pointer">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="pdf-upload"
                  disabled={uploading}
                />
                <Label htmlFor="pdf-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                      {uploading ? (
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8 text-blue-600" />
                      )}
                    </div>
                    <div className="text-gray-900 font-medium mb-2">
                      {uploading ? 'Uploading...' : 'Click to Upload PDF Form'}
                    </div>
                    <div className="text-gray-500 text-sm">PDF only • Max 10MB</div>
                  </div>
                </Label>
              </div>
            </div>

            <div>
              <Label className="text-gray-700 mb-3 block font-medium">Or Select Official Form</Label>
              <div className="grid md:grid-cols-2 gap-3">
                {officialForms.map((form, i) => (
                  <button
                    key={i}
                    onClick={() => setPdfUrl(form.url)}
                    className="border-2 border-gray-200 rounded-lg p-4 text-left hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{form.name}</p>
                        <p className="text-xs text-gray-500">Official Thai Immigration form</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {pdfUrl && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-gray-900 font-medium">Form Loaded</span>
              </div>
              <Button
                onClick={() => {
                  setPdfUrl(null);
                  setFields([]);
                  setPdfLoaded(false);
                }}
                variant="outline"
                size="sm"
              >
                Change Form
              </Button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Important Notes:</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• Fill out all fields digitally with clean, readable text</li>
                    <li>• Text appears in blue pen color for official look</li>
                    <li>• Do NOT sign digitally - sign with pen after printing</li>
                    <li>• Print on white A4 paper for submission</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-100 border-b border-gray-200 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={addTextField} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Type className="w-4 h-4 mr-2" />
                    Add Text Field
                  </Button>
                  <div className="h-6 w-px bg-gray-300" />
                  <Button size="sm" variant="outline" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">{Math.round(zoom * 100)}%</span>
                  <Button size="sm" variant="outline" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={saveTemplate}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Template
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={generatePDF} 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={fields.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>

              <div 
                ref={canvasRef}
                className="relative bg-white overflow-auto"
                style={{ 
                  minHeight: '800px',
                  maxHeight: '800px'
                }}
              >
                {/* PDF Preview with iframe */}
                <div className="relative" style={{ 
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  minHeight: '800px'
                }}>
                  {!pdfLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-600">Loading PDF...</p>
                      </div>
                    </div>
                  )}
                  
                  <iframe
                    ref={iframeRef}
                    src={pdfUrl}
                    className="w-full h-[800px] border-0"
                    title="PDF Preview"
                    style={{ opacity: pdfLoaded ? 1 : 0 }}
                  />

                  {/* Text fields overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="relative w-full h-full pointer-events-none">
                      {fields.map(field => (
                        <div
                          key={field.id}
                          draggable
                          onDragStart={() => handleFieldDragStart(field.id)}
                          onDrag={(e) => handleFieldDrag(e, field.id)}
                          onDragEnd={handleFieldDragEnd}
                          onClick={() => setSelectedField(field.id)}
                          className={`absolute cursor-move pointer-events-auto ${
                            selectedField === field.id ? 'ring-2 ring-blue-500' : ''
                          }`}
                          style={{
                            left: `${field.x}px`,
                            top: `${field.y}px`,
                            width: `${field.width}px`,
                            height: `${field.height}px`
                          }}
                        >
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => updateField(field.id, { value: e.target.value })}
                            placeholder="Click to type..."
                            style={{
                              fontSize: `${field.fontSize}px`,
                              color: field.color,
                              fontFamily: field.fontFamily,
                              border: '1px dashed #cbd5e1',
                              background: 'rgba(255, 255, 255, 0.9)',
                              width: '100%',
                              height: '100%',
                              padding: '4px'
                            }}
                            className="outline-none"
                          />
                          {selectedField === field.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteField(field.id);
                              }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 z-10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {selectedField && (
              <GlassCard className="p-4">
                <h3 className="font-bold text-gray-900 mb-3">Field Properties</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600 mb-1 block">Font Size</Label>
                    <Input
                      type="number"
                      value={fields.find(f => f.id === selectedField)?.fontSize || 14}
                      onChange={(e) => updateField(selectedField, { fontSize: parseInt(e.target.value) })}
                      min="8"
                      max="48"
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 mb-1 block">Width</Label>
                    <Input
                      type="number"
                      value={fields.find(f => f.id === selectedField)?.width || 200}
                      onChange={(e) => updateField(selectedField, { width: parseInt(e.target.value) })}
                      min="50"
                      max="600"
                      className="h-8"
                    />
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}