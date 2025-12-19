import { IsNotEmpty, IsString, IsIn , IsOptional} from "class-validator";

import { PunchType } from "../models/enums/index";

export class CreateAttendancePunchDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string; 

  @IsNotEmpty()
  @IsIn([PunchType.IN, PunchType.OUT])
  punchType: PunchType; 
  
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}



