import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/react";
import api from "@/lib/api";

const GlobalSettings = () => {
  const [numSlotMachines, setNumSlotMachines] = useState("3");
  const [tempNumSlotMachines, setTempNumSlotMachines] = useState("3");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchNumSlotMachines = async () => {
      try {
        const response = await api.get(`/settings/numSlotMachines`);
        setNumSlotMachines(response.data.value);
        setTempNumSlotMachines(response.data.value);
      } catch (error) {
        // @ts-ignore
        if (error.response && error.response.status === 404) {
          // If setting not found, create it with default value
          await handleSave();
        } else {
          console.error("Error fetching number of slot machines:", error);
        }
      }
    };

    fetchNumSlotMachines();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put(`/settings/`, {
        key: "numSlotMachines",
        value: tempNumSlotMachines,
      });
      setNumSlotMachines(tempNumSlotMachines);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating number of slot machines:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempNumSlotMachines(numSlotMachines);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Paramètres globaux</h2>
      </CardHeader>
      <CardBody>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-slate-500">Nombre de tirages par défaut</span>
            {isEditing ? (
                <Select
                  selectedKeys={new Set([tempNumSlotMachines])}
                  onSelectionChange={(keys) => setTempNumSlotMachines(Array.from(keys)[0] as string)}
                >
                  <SelectItem key="1">1</SelectItem>
                  <SelectItem key="2">2</SelectItem>
                  <SelectItem key="3">3</SelectItem>
                  <SelectItem key="4">4</SelectItem>
                  <SelectItem key="5">5</SelectItem>
                </Select>
            ) : (
              <span>{numSlotMachines}</span>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          {isEditing ? (
            <>
              <Button variant="light" onPress={handleCancel}>Annuler</Button>
              <Button color="primary" onPress={handleSave} disabled={isSaving}>
                {isSaving ? <Spinner size="sm" /> : "Valider"}
              </Button>
            </>
          ) : (
            <Button variant="solid" onPress={() => setIsEditing(true)}>Modifier</Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default GlobalSettings;
