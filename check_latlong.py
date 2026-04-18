import xlrd, sys
sys.stdout.reconfigure(encoding='utf-8')
wb = xlrd.open_workbook(r"BRT  Non BRT Route Details  Bus Stop LatLong (1).xls")
s = wb.sheet_by_name('376  Rout name, Stage & LL')
for r in range(1, min(6, s.nrows)):
    print(f"Row {r}: name={s.cell_value(r,4)}, lat={s.cell_value(r,6)}, long={s.cell_value(r,7)}")

# Count how many stops have lat/long
has_ll = 0
total = 0
for r in range(1, s.nrows):
    total += 1
    lat = s.cell_value(r, 6)
    lng = s.cell_value(r, 7)
    if lat and lng:
        has_ll += 1
print(f"\nTotal rows: {total}, With LatLong: {has_ll}, Missing: {total - has_ll}")
