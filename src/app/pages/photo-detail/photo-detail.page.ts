import { Component, OnInit } from '@angular/core';
import { PhotoService, UserPhoto } from 'src/app/services/photo.service';
import { ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';


@Component({
  selector: 'app-photo-detail',
  templateUrl: './photo-detail.page.html',
  styleUrls: ['./photo-detail.page.scss'],
  standalone: false,
})
export class PhotoDetailPage implements OnInit {

  photo!: UserPhoto;
  locationName?: string;

  constructor(private route: ActivatedRoute, public photoService: PhotoService, 
    private http: HttpClient, private toastController: ToastController) {
    // odstraní defaultní cestu k ikonám
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    // nastaví vlastní cesty k ikonám markeru
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png'
    });
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.photo = this.photoService.photos[id];

    if (this.photo.latitude && this.photo.longitude) {
      this.getLocationName(this.photo.latitude, this.photo.longitude);
    }
  }

  ngAfterViewInit() {
    if (this.photo?.latitude && this.photo?.longitude) {
      const map = L.map('map').setView([this.photo.latitude, this.photo.longitude], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      L.marker([this.photo.latitude, this.photo.longitude])
        .addTo(map)
        .bindPopup('Fotografie pořízena zde')
        .openPopup();

      // Nutné, pokud se mapa renderuje ve skrytém / flex kontejneru
      setTimeout(() => map.invalidateSize(), 0);
    }
  }

  save() {
    this.photoService.savePhotos();

    this.presentToast('Fotka byla uložena!');
  }

  getLocationName(lat: number, lon: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

    this.http.get<any>(url).subscribe({
      next: (data) => {
        // Získáme město, obec nebo vesnici
        this.locationName = data.address?.city 
                        || data.address?.town 
                        || data.address?.village 
                        || '';
      },
      error: (err) => {
        console.warn('Nepodařilo se načíst lokaci:', err);
        this.locationName = '';
      }
    });
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,    // délka zobrazení v ms
      color: 'success',  // barva toastu (success, warning, danger, primary...)
      position: 'bottom' // pozice: top, middle, bottom
    });
    toast.present();
  }
}
