import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';

export const SettingsModal = ({ isOpen, onClose, profile, setProfile }) => {
    if (!isOpen) return null;

    const updateProfile = (field, value) => {
        setProfile((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-lg mx-4 p-0 shadow-2xl relative overflow-hidden bg-card border-border animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/30">
                    <div>
                        <h2 className="text-xl font-heading font-semibold text-foreground">Patient Settings</h2>
                        <p className="text-sm text-muted-foreground mt-1">Manage your health profile key details.</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                        <X size={20} />
                    </Button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh] scrollbar-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Age
                            <Input
                                type="number"
                                min="0"
                                placeholder="Years"
                                value={profile.age}
                                onChange={(e) => updateProfile('age', e.target.value)}
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Sex
                            <Input
                                type="text"
                                placeholder="e.g. Female"
                                value={profile.sex}
                                onChange={(e) => updateProfile('sex', e.target.value)}
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Height (cm)
                            <Input
                                type="number"
                                min="0"
                                placeholder="cm"
                                value={profile.height}
                                onChange={(e) => updateProfile('height', e.target.value)}
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Weight (kg)
                            <Input
                                type="number"
                                min="0"
                                placeholder="kg"
                                value={profile.weight}
                                onChange={(e) => updateProfile('weight', e.target.value)}
                            />
                        </label>
                        <label className="col-span-1 md:col-span-2 flex flex-col gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Location
                            <Input
                                type="text"
                                placeholder="City, Country"
                                value={profile.location}
                                onChange={(e) => updateProfile('location', e.target.value)}
                            />
                        </label>
                        <label className="col-span-1 md:col-span-2 flex flex-col gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Existing Conditions
                            <Input
                                type="text"
                                placeholder="e.g. Diabetes, Hypertension"
                                value={profile.conditions}
                                onChange={(e) => updateProfile('conditions', e.target.value)}
                            />
                        </label>
                        <label className="col-span-1 md:col-span-2 flex flex-col gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Current Medications
                            <Input
                                type="text"
                                placeholder="e.g. Metformin, Lisinopril"
                                value={profile.medications}
                                onChange={(e) => updateProfile('medications', e.target.value)}
                            />
                        </label>
                        <label className="col-span-1 md:col-span-2 flex flex-col gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Allergies
                            <Input
                                type="text"
                                placeholder="e.g. Penicillin, Peanuts"
                                value={profile.allergies}
                                onChange={(e) => updateProfile('allergies', e.target.value)}
                            />
                        </label>
                    </div>
                </div>

                <div className="p-4 border-t border-border bg-secondary/10 flex justify-end">
                    <Button onClick={onClose} className="px-8">
                        Done
                    </Button>
                </div>
            </Card>
        </div>
    );
};
