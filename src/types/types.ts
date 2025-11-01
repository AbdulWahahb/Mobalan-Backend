import { RowDataPacket } from "mysql2";

export interface getCustomerType {
  id: number;
  name: string;
  phone: string;
  age: number;
  created_at: string;
  measurement: getMeasurements;
}

export interface getMeasurements extends RowDataPacket {
  measurements_id: number;
  shirt_length: string;
  shoulder_width: string;
  chest: string;
  waist: string;
  sleeve_length: string;
  cuff: string;
  collar: string;
  collar_height: string;
  pants_waist: string;
  pants_hip: string;
  pants_length: string;
  pants_rise: string;
  pants_thigh: string;
  pants_cuff: string;
}
