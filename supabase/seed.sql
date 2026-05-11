insert into public.sources (name, url, description, language) values
  ('Masa Israel Journey', 'https://www.masaisrael.org/programs/', 'Long-term immersive programs in Israel for ages 16-30 (gap year, study, internship, volunteering).', 'en'),
  ('Birthright Israel', 'https://www.birthrightisrael.com/trip-types', 'Free 10-day educational trips to Israel for Jewish young adults 18-32.', 'en'),
  ('Onward Israel', 'https://www.onwardisrael.org/programs', 'Subsidized internships and academic programs in Israel.', 'en'),
  ('Lauder Foundation', 'https://www.lauderfoundation.com/programs', 'Jewish education and community-building programs across Central and Eastern Europe.', 'en'),
  ('JDC Entwine', 'https://www.jdcentwine.org/programs', 'Global Jewish service and leadership programs by the Joint Distribution Committee.', 'en'),
  ('EUJS - European Union of Jewish Students', 'https://www.eujs.org/seminars-and-events/', 'Seminars, leadership programs, and events for Jewish students across Europe.', 'en'),
  ('Hillel International', 'https://www.hillel.org/jewish/find-experiences/', 'Jewish campus experiences, trips, and learning programs worldwide.', 'en'),
  ('The Jewish Agency for Israel', 'https://www.jewishagency.org/programs/', 'Aliyah, education, and identity programs connecting Diaspora to Israel.', 'en'),
  ('Shavei Israel', 'https://shavei.org/category/news/', 'Programs and outreach for people discovering Jewish roots, including in Poland.', 'en'),
  ('Taube Center for Jewish Life and Learning', 'https://taubecenter.org/programs/', 'Jewish heritage programs in Poland, especially Warsaw and Krakow.', 'en'),
  ('POLIN Museum Education', 'https://www.polin.pl/en/learning', 'Educational programs at the Museum of the History of Polish Jews in Warsaw.', 'en'),
  ('Pardes Institute of Jewish Studies', 'https://www.pardes.org.il/programs/', 'Open, pluralistic Jewish learning programs in Jerusalem for adults of all backgrounds.', 'en'),
  ('Mechon Hadar', 'https://www.hadar.org/torah/learning-opportunities', 'Egalitarian Jewish learning programs and fellowships.', 'en'),
  ('BINA Secular Yeshiva', 'https://www.bina.org.il/en/programs/', 'Secular Jewish learning and social action in Israel.', 'en'),
  ('Nativ College Leadership Program', 'https://www.usy.org/nativ/', 'A gap-year leadership program combining study in Jerusalem with volunteering in Be''er Sheva.', 'en'),
  ('Bronfman Fellowship', 'https://bronfman.org/programs/', 'Pluralistic fellowships for Jewish teens and young adults.', 'en'),
  ('Jewish Heritage Europe', 'https://jewish-heritage-europe.eu/news/', 'Updates on Jewish heritage programs, conferences, and events across Europe.', 'en')
on conflict (url) do nothing;
