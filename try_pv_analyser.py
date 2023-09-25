import socketio
import RPi.GPIO as GPIO
import time
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import math
from scipy.interpolate import interp1d
from pymodbus.constants import Endian
from pymodbus.constants import Defaults
from pymodbus.payload import BinaryPayloadDecoder
from pymodbus.client.sync import ModbusSerialClient as ModbusClient
from pymodbus.transaction import ModbusRtuFramer
from pymodbus.payload import BinaryPayloadBuilder
import json
sio = socketio.Client()

# settings for USB-RS485 adapter
SERIAL = '/dev/ttyUSB0'
BAUD = 9600
# set Modbus defaults
Defaults.UnitId = 1
Defaults.Retries = 5
counter = 1
client = ModbusClient(method='rtu', port=SERIAL, stopbits=1, bytesize=8, timeout=3, baudrate=BAUD, parity='N')
connection = client.connect()

# settings for relay
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(21,GPIO.OUT)

@sio.on('message-from-node')
def on_message(data):
    print('Received message from server:', data)
    if data is True:
        count=2
        GPIO.output(21,GPIO.LOW)
        time.sleep(2)
        #print ("Open Circuit")
        result = client.read_holding_registers(30024,int(count),unit=50)
        client.close()
        decoder = BinaryPayloadDecoder.fromRegisters(result.registers, Endian.Big, wordorder=Endian.Big)
        Voc = float(decoder.decode_32bit_float())
        #print("voc: ", Voc)
        GPIO.output(21,GPIO.HIGH)
        time.sleep(2)
        #print ("Short Circuit")
        result = client.read_holding_registers(30004,int(count),unit=50)
        client.close()
        decoder = BinaryPayloadDecoder.fromRegisters(result.registers, Endian.Big, wordorder=Endian.Big)
        Isc = float(decoder.decode_32bit_float())
        #print("Isc: ", Isc)        
        GPIO.output(21,GPIO.LOW)
        time.sleep(2)
        
        Voc = round(Voc, 2)
        Isc = round(Isc, 2)
        if Voc >= 0 and Isc <= 0.20:
            
            pow1=Voc*Isc
            data = {'Voltage': Voc, 'Current': Isc,'Power':pow1}
            
            data=[data]
            data_json = json.dumps(data, indent=4)  # Convert to JSON string with indentation

            # Print the JSON data
            #print(data_json)

            # Save the JSON data to a file named "solar_data.json"
            with open('solar_data.json', 'w') as json_file:
                json.dump(data, json_file, indent=4)
                
        else:
                
            if Voc>0 and Isc>0.20 and Isc<=0.65:
                        voltage_values = voc_step = np.linspace(0, Voc, 8)
                        voltage_values=voltage_values.tolist()

                        data = pd.DataFrame({'Voltage': voltage_values})
                        
                        num_rows = len(data)
                        isc_values = [Isc if i < num_rows - 2 else Isc - 0.10 if i == num_rows - 2 else 0.0 for i in range(num_rows)]
                        data['Current'] = isc_values
                        
                        # Smoothing the I-V Characteristic
                        change_index = data[data['Current'] == Isc].index[-1]
                        smooth_voltage_range = data['Voltage'][change_index:change_index + 2]
                        interp_function = interp1d(data['Voltage'], data['Current'], kind='quadratic')

                        smooth_voltage = np.linspace(0, data['Voltage'][len(data) - 1], 80)
                        smooth_current = np.round(interp_function(smooth_voltage), 2)

                        value_to_find = Isc
                        for i in range(len(smooth_current)):
                                if smooth_current[i] > Isc:
                                        smooth_current[i] = Isc
                        indices = np.where(smooth_current == value_to_find)[0]

                        if len(indices) > 0:
                                last_index = indices[-1]
                        else:
                                last_index = None

                        voltage_list = data['Voltage'][:change_index].tolist()
                        voltage_list.extend(smooth_voltage[last_index-3 :])
                        current_list = data['Current'][:change_index].tolist()

                        current_list.extend(smooth_current[last_index -3:])
                        new_data = pd.DataFrame({'Voltage': voltage_list, 'Current': current_list})
                        new_data['Power']=new_data['Voltage']*new_data['Current']
                        # Remove rows with negative 'Current'



                        # Export data to JSON
                        new_data.to_json('solar_data.json', orient='records')
                    
            else:
                    if Voc>0 and Isc>0.65 and Isc<=1.5:
                        voltage_values = voc_step = np.linspace(0, Voc, 8)
                        voltage_values=voltage_values.tolist()

                        data = pd.DataFrame({'Voltage': voltage_values})
                        
                        num_rows = len(data)
                        isc_values = [Isc if i < num_rows - 2 else Isc - 0.30 if i == num_rows - 2 else 0.0 for i in range(num_rows)]
                        data['Current'] = isc_values
                        
                        # Smoothing the I-V Characteristic
                        change_index = data[data['Current'] == Isc].index[-1]
                        smooth_voltage_range = data['Voltage'][change_index:change_index + 2]
                        interp_function = interp1d(data['Voltage'], data['Current'], kind='quadratic')

                        smooth_voltage = np.linspace(0, data['Voltage'][len(data) - 1], 80)
                        smooth_current = np.round(interp_function(smooth_voltage), 2)

                        value_to_find = Isc
                        for i in range(len(smooth_current)):
                                if smooth_current[i] > Isc:
                                        smooth_current[i] = Isc
                        indices = np.where(smooth_current == value_to_find)[0]

                        if len(indices) > 0:
                                last_index = indices[-1]
                        else:
                                last_index = None

                        voltage_list = data['Voltage'][:change_index].tolist()
                        voltage_list.extend(smooth_voltage[last_index-3 :])
                        current_list = data['Current'][:change_index].tolist()

                        current_list.extend(smooth_current[last_index -3:])
                        new_data = pd.DataFrame({'Voltage': voltage_list, 'Current': current_list})
                        new_data['Power']=new_data['Voltage']*new_data['Current']
                        # Remove rows with negative 'Current'



                        # Export data to JSON
                        new_data.to_json('solar_data.json', orient='records')
                                
                            
                    else:
         
            
           
           
                            voltage_values = voc_step = np.linspace(0, Voc, 5)
                            voltage_values=voltage_values.tolist()
                            
                            data = pd.DataFrame({'Voltage': voltage_values})
                            
                            num_rows = len(data)
                            isc_values = [Isc if i < num_rows - 2 else Isc - 0.75 if i == num_rows - 2 else 0.0 for i in range(num_rows)]
                            data['Current'] = isc_values
                            
                            # Smoothing the I-V Characteristic
                            change_index = data[data['Current'] == Isc].index[-1]
                            smooth_voltage_range = data['Voltage'][change_index:change_index + 2]
                            interp_function = interp1d(data['Voltage'], data['Current'], kind='quadratic')

                            smooth_voltage = np.linspace(0, data['Voltage'][len(data) - 1], 100)
                            smooth_current = np.round(interp_function(smooth_voltage), 2)

                            value_to_find = Isc
                            for i in range(len(smooth_current)):
                                if smooth_current[i] > Isc:
                                    smooth_current[i] = Isc
                            indices = np.where(smooth_current == value_to_find)[0]

                            if len(indices) > 0:
                                last_index = indices[-1]
                            else:
                                last_index = None

                            voltage_list = data['Voltage'][:change_index].tolist()
                            voltage_list.extend(smooth_voltage[last_index-3 :])
                            current_list = data['Current'][:change_index].tolist()
                            
                            current_list.extend(smooth_current[last_index -3:])
                            new_data = pd.DataFrame({'Voltage': voltage_list, 'Current': current_list})
                            new_data['Power']=new_data['Voltage']*new_data['Current']
                            # Remove rows with negative 'Current'
                            
                            

                            # Export data to JSON
                            new_data.to_json('solar_data.json', orient='records')
            
            

@sio.on('connect')
def on_connect():
    print('Connected to the Socket.IO server')


@sio.on('disconnect')
def on_disconnect():
    print('Disconnected from the Socket.IO server')


sio.connect('http://localhost:5000/')



try:
    while True:
        pass
except KeyboardInterrupt:
    sio.disconnect()
