import { getProfilePictureUrl } from './config';

describe('getProfilePictureUrl', () => {
  it('uses the local placeholder when a member has no profile picture', () => {
    expect(getProfilePictureUrl(null)).toBe('/default.jpg');
  });

  it('keeps an absolute image URL unchanged', () => {
    const imageUrl = 'https://images.example.com/profiles/member.jpg';
    expect(getProfilePictureUrl(imageUrl)).toBe(imageUrl);
  });
});
