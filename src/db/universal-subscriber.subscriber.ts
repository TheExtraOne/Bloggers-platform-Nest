import {
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
} from 'typeorm';

@EventSubscriber()
export class AutoUpdatedAtSubscriber implements EntitySubscriberInterface {
  beforeUpdate(event: UpdateEvent<any>) {
    // Check if the entity has "updatedAt" property (by convention)
    if (event.entity && 'updatedAt' in event.entity) {
      event.entity.updatedAt = new Date();
    }
  }
}
