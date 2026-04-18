import xlrd
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

wb = xlrd.open_workbook(r"BRT  Non BRT Route Details  Bus Stop LatLong (1).xls")

# --- Parse Route Descriptions for Marathi route names and km ---
desc_sheet = wb.sheet_by_name('Route Description')
route_desc = {}
for r in range(1, desc_sheet.nrows):
    route_id = str(desc_sheet.cell_value(r, 0)).strip()
    desc_en = str(desc_sheet.cell_value(r, 1)).strip()
    desc_mr = str(desc_sheet.cell_value(r, 2)).strip()
    km = desc_sheet.cell_value(r, 3)
    route_desc[route_id] = {
        'desc_en': desc_en,
        'desc_mr': desc_mr,
        'km': km
    }

# --- Parse main route data from '376 Rout name, Stage & LL' ---
main_sheet = wb.sheet_by_name('376  Rout name, Stage & LL')
routes = {}  # key = route_id -> { type, bus, direction, stops: [{order, name, name_mr}] }

for r in range(1, main_sheet.nrows):
    route_type = str(main_sheet.cell_value(r, 0)).strip()
    route_id = str(main_sheet.cell_value(r, 1)).strip()
    stop_seq_raw = main_sheet.cell_value(r, 3)
    stop_name = str(main_sheet.cell_value(r, 4)).strip()
    stop_name_mr = str(main_sheet.cell_value(r, 5)).strip()
    
    if not route_id or not stop_name:
        continue
    
    try:
        stop_seq = int(stop_seq_raw)
    except (ValueError, TypeError):
        continue

    if route_id not in routes:
        # Parse bus number and direction from route_id like "100-D" or "29-U"
        parts = route_id.rsplit('-', 1)
        bus_num = parts[0] if len(parts) > 1 else route_id
        dir_code = parts[-1].upper() if len(parts) > 1 else ''
        direction = 'OUT' if dir_code == 'D' else 'IN' if dir_code == 'U' else dir_code
        
        # Get route description
        desc = route_desc.get(route_id, {})
        route_name_en = desc.get('desc_en', f'Route {bus_num}')
        route_name_mr = desc.get('desc_mr', '')
        km = desc.get('km', 0)
        
        routes[route_id] = {
            'bus': bus_num,
            'route': route_name_en,
            'route_mr': route_name_mr,
            'direction': direction,
            'type': route_type,
            'km': km,
            'stops': []
        }
    
    # Parse lat/long from columns 6 and 7
    lat = main_sheet.cell_value(r, 6)
    lng = main_sheet.cell_value(r, 7)
    stop_entry = {
        'order': stop_seq,
        'name': stop_name,
        'name_mr': stop_name_mr
    }
    if lat and lng:
        try:
            stop_entry['lat'] = round(float(lat), 6)
            stop_entry['lng'] = round(float(lng), 6)
        except (ValueError, TypeError):
            pass
    routes[route_id]['stops'].append(stop_entry)

# Sort stops by order within each route
for route_id in routes:
    routes[route_id]['stops'].sort(key=lambda s: s['order'])

# Convert to list
bus_data = list(routes.values())

# Sort by bus number
def sort_key(r):
    bus = r['bus']
    # Try to extract numeric part for proper sorting
    num_part = ''
    alpha_part = ''
    for c in bus:
        if c.isdigit():
            num_part += c
        else:
            alpha_part += c
    return (int(num_part) if num_part else 99999, alpha_part)

bus_data.sort(key=sort_key)

print(f"Total routes parsed: {len(bus_data)}")
print(f"Total unique bus numbers: {len(set(r['bus'] for r in bus_data))}")

# Count stops
total_stops = sum(len(r['stops']) for r in bus_data)
print(f"Total stops across all routes: {total_stops}")

# Unique stop names
all_stops = set()
for r in bus_data:
    for s in r['stops']:
        all_stops.add(s['name'])
print(f"Unique stop names: {len(all_stops)}")

# Write data.js
js_content = "// Auto-generated bus route data with Marathi translations\n"
js_content += "const BUS_DATA = " + json.dumps(bus_data, ensure_ascii=False, separators=(',', ':')) + ";\n"

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"\ndata.js written successfully! Size: {len(js_content)} bytes")
print(f"\nSample routes:")
for r in bus_data[:3]:
    print(f"  Bus {r['bus']} ({r['direction']}): {r['route']} | {r['route_mr']} | {len(r['stops'])} stops")
    if r['stops']:
        s = r['stops'][0]
        print(f"    First stop: {s['name']} / {s['name_mr']}")
