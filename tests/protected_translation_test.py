"""Offline checks for the generator's protected quantities; no remote translation."""
import pathlib,sys,unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts/i18n'))
from protected_translation import prepare,restore
class ProtectedTranslation(unittest.TestCase):
 def test_quantities_and_names(self):
  for source,wanted in [('5 萬株','50000 plants'),('95 折','5% off'),('8.6 折','14% off'),('530萬株','5300000 plants'),('武甲山','Mount Bukō'),('新津站','Niitsu Station')]:
   prepared,keep=prepare(source,'en');self.assertEqual(restore(prepared,keep,'en').strip(),wanted)
 def test_span_contents_may_change_but_identity_cannot(self):
  prepared,keep=prepare('40萬株','en')
  self.assertEqual(restore(prepared.replace('400000 plants','40 plants'),keep,'en').strip(),'400000 plants')
  with self.assertRaises(ValueError):restore(prepared.replace('tabikeep0','missing'),keep,'en')
 def test_plain_text_output_and_template(self):
  prepared,keep=prepare('剩餘 ZXQVAR0QXZ 天','en')
  value=restore(prepared,keep,'en');self.assertIn('ZXQVAR0QXZ',value);self.assertNotIn('<span',value)
if __name__=='__main__':unittest.main()
