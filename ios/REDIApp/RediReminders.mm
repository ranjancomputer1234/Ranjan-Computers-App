#import <React/RCTBridgeModule.h>
#import <UserNotifications/UserNotifications.h>

@interface RediReminders : NSObject <RCTBridgeModule>
@end

static NSString *REDIPermissionName(UNAuthorizationStatus status)
{
  switch (status) {
    case UNAuthorizationStatusAuthorized:
    case UNAuthorizationStatusProvisional:
    case UNAuthorizationStatusEphemeral:
      return @"authorized";
    case UNAuthorizationStatusDenied:
      return @"denied";
    case UNAuthorizationStatusNotDetermined:
      return @"not_determined";
  }
  return @"unavailable";
}

@implementation RediReminders

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

RCT_REMAP_METHOD(permissionStatus,
                 permissionStatusWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
    resolve(REDIPermissionName(settings.authorizationStatus));
  }];
}

RCT_REMAP_METHOD(requestPermission,
                 requestPermissionWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter]
    requestAuthorizationWithOptions:(UNAuthorizationOptionAlert | UNAuthorizationOptionSound | UNAuthorizationOptionBadge)
    completionHandler:^(BOOL granted, NSError *error) {
      if (error != nil) {
        reject(@"reminder_permission_failed", @"Could not request notification permission.", error);
      } else {
        resolve(granted ? @"authorized" : @"denied");
      }
    }];
}

RCT_REMAP_METHOD(scheduleDaily,
                 scheduleDaily:(NSString *)identifier
                 hour:(nonnull NSNumber *)hour
                 minute:(nonnull NSNumber *)minute
                 title:(NSString *)title
                 body:(NSString *)body
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSInteger hourValue = hour.integerValue;
  NSInteger minuteValue = minute.integerValue;
  if (hourValue < 0 || hourValue > 23 || minuteValue < 0 || minuteValue > 59) {
    reject(@"invalid_reminder_time", @"The reminder time is invalid.", nil);
    return;
  }
  UNMutableNotificationContent *content = [UNMutableNotificationContent new];
  content.title = title;
  content.body = body;
  content.sound = UNNotificationSound.defaultSound;
  NSDateComponents *components = [NSDateComponents new];
  components.hour = hourValue;
  components.minute = minuteValue;
  UNCalendarNotificationTrigger *trigger = [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:components repeats:YES];
  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:identifier content:content trigger:trigger];
  [[UNUserNotificationCenter currentNotificationCenter] addNotificationRequest:request withCompletionHandler:^(NSError *error) {
    if (error != nil) reject(@"reminder_schedule_failed", @"Could not schedule the daily reminder.", error);
    else resolve(@YES);
  }];
}

RCT_REMAP_METHOD(scheduleOnce,
                 scheduleOnce:(NSString *)identifier
                 timestampMs:(nonnull NSNumber *)timestampMs
                 title:(NSString *)title
                 body:(NSString *)body
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSTimeInterval interval = timestampMs.doubleValue / 1000.0 - NSDate.date.timeIntervalSince1970;
  if (interval <= 0) {
    resolve(@NO);
    return;
  }
  UNMutableNotificationContent *content = [UNMutableNotificationContent new];
  content.title = title;
  content.body = body;
  content.sound = UNNotificationSound.defaultSound;
  UNTimeIntervalNotificationTrigger *trigger = [UNTimeIntervalNotificationTrigger triggerWithTimeInterval:MAX(1, interval) repeats:NO];
  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:identifier content:content trigger:trigger];
  [[UNUserNotificationCenter currentNotificationCenter] addNotificationRequest:request withCompletionHandler:^(NSError *error) {
    if (error != nil) reject(@"reminder_schedule_failed", @"Could not schedule the class reminder.", error);
    else resolve(@YES);
  }];
}

RCT_REMAP_METHOD(cancel,
                 cancel:(NSString *)identifier
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center removePendingNotificationRequestsWithIdentifiers:@[identifier]];
  [center removeDeliveredNotificationsWithIdentifiers:@[identifier]];
  resolve(nil);
}

@end
